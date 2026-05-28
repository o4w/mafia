from django.urls import path
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..models import QuestTemplate, PlayerQuest
from ..serializers import PlayerQuestSerializer
import random


@api_view(['GET'])
def quest_list(request):
    player = request.user.player
    player.regenerate_energy()

    templates = QuestTemplate.objects.filter(
        is_active=True,
        min_player_level__lte=player.level,
    )

    result = []
    for template in templates:
        pq, _ = PlayerQuest.objects.get_or_create(
            player=player,
            quest_template=template,
        )
        result.append(pq)

    serializer = PlayerQuestSerializer(result, many=True)
    return Response({
        'quests': serializer.data,
        'energy': player.energy,
        'max_energy': player.max_energy,
    })


@api_view(['POST'])
def do_quest(request, quest_id):
    player = request.user.player
    player.regenerate_energy()

    try:
        template = QuestTemplate.objects.get(id=quest_id, is_active=True)
    except QuestTemplate.DoesNotExist:
        return Response({'error': 'Görev bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

    if player.level < template.min_player_level:
        return Response({'error': 'Seviyeniz yeterli değil.'}, status=status.HTTP_403_FORBIDDEN)

    if player.energy < template.energy_cost:
        return Response({'error': 'Yeterli enerji yok.'}, status=status.HTTP_400_BAD_REQUEST)

    pq, _ = PlayerQuest.objects.get_or_create(player=player, quest_template=template)

    if pq.is_on_cooldown:
        return Response({
            'error': 'Görev bekleme süresinde.',
            'cooldown_remaining': pq.cooldown_remaining,
        }, status=status.HTTP_400_BAD_REQUEST)

    # Para ödülü hesapla
    money_reward = random.uniform(
        float(template.money_reward_min),
        float(template.money_reward_max),
    )
    money_reward = round(money_reward, 2)

    # Uygula
    player.energy -= template.energy_cost
    player.money += money_reward
    leveled_up = player.add_xp(template.xp_reward)
    player.save(update_fields=['energy', 'money'])

    pq.last_completed_at = timezone.now()
    pq.total_completed += 1
    pq.save()

    return Response({
        'success': True,
        'money_reward': money_reward,
        'xp_reward': template.xp_reward,
        'leveled_up': leveled_up,
        'new_level': player.level,
        'new_money': float(player.money),
        'new_energy': player.energy,
        'cooldown_remaining': pq.cooldown_remaining,
    })


urlpatterns = [
    path('', quest_list, name='quest-list'),
    path('<int:quest_id>/do/', do_quest, name='do-quest'),
]
