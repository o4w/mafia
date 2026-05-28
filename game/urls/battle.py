from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..models import Player, BattleLog
from ..serializers import BattleLogSerializer, LeaderboardSerializer
import random


def calculate_win_chance(attacker_power, defender_power):
    total = attacker_power + defender_power
    if total == 0:
        return 50
    chance = (attacker_power / total) * 100
    return max(10, min(90, chance))


@api_view(['POST'])
def attack(request, defender_id):
    attacker = request.user.player

    if attacker.id == defender_id:
        return Response({'error': 'Kendinize saldıramazsınız.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        defender = Player.objects.get(id=defender_id)
    except Player.DoesNotExist:
        return Response({'error': 'Oyuncu bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

    # Seviye farkı kontrolü (±5 seviye)
    level_diff = abs(attacker.level - defender.level)
    if level_diff > 5:
        return Response({
            'error': 'Seviye farkı çok büyük (max ±5 seviye).',
        }, status=status.HTTP_400_BAD_REQUEST)

    win_chance = calculate_win_chance(attacker.power, defender.power)
    won = random.random() * 100 < win_chance

    money_transferred = 0
    xp_gained = 0

    if won:
        # Kazanma: savunucunun parasının %10-20'sini al
        steal_pct = random.uniform(0.10, 0.20)
        money_transferred = round(float(defender.money) * steal_pct, 2)
        money_transferred = min(money_transferred, float(defender.money))
        xp_gained = int(defender.level * 15)

        attacker.money += money_transferred
        defender.money -= money_transferred
        attacker.add_xp(xp_gained)
        defender.save(update_fields=['money'])
        attacker.save(update_fields=['money'])
    else:
        # Kaybetme: saldırganın parasının %5'ini kaybet
        lose_pct = 0.05
        money_transferred = round(float(attacker.money) * lose_pct, 2)
        attacker.money -= money_transferred
        defender.money += money_transferred
        xp_gained = int(defender.level * 5)
        attacker.save(update_fields=['money'])
        defender.save(update_fields=['money'])

    log = BattleLog.objects.create(
        attacker=attacker,
        defender=defender,
        result='WIN' if won else 'LOSE',
        money_transferred=money_transferred,
        xp_gained=xp_gained,
        attacker_power=attacker.power,
        defender_power=defender.power,
    )

    return Response({
        'result': 'WIN' if won else 'LOSE',
        'won': won,
        'win_chance': round(win_chance, 1),
        'money_transferred': money_transferred,
        'xp_gained': xp_gained if won else 0,
        'new_money': float(attacker.money),
        'leveled_up': False,
        'battle_id': log.id,
    })


@api_view(['GET'])
def battle_history(request):
    player = request.user.player
    logs = BattleLog.objects.filter(
        attacker=player
    ).union(
        BattleLog.objects.filter(defender=player)
    ).order_by('-created_at')[:20]

    # union sonrası serialize
    logs = BattleLog.objects.filter(
        id__in=[l.id for l in logs]
    ).order_by('-created_at')

    return Response(BattleLogSerializer(logs, many=True).data)


@api_view(['GET'])
def targets(request):
    player = request.user.player
    level_min = max(1, player.level - 5)
    level_max = player.level + 5

    candidates = Player.objects.filter(
        level__gte=level_min,
        level__lte=level_max,
    ).exclude(id=player.id).order_by('?')[:10]

    result = []
    for candidate in candidates:
        win_chance = calculate_win_chance(player.power, candidate.power)
        result.append({
            'id': candidate.id,
            'username': candidate.user.username,
            'level': candidate.level,
            'power': candidate.power,
            'win_chance': round(win_chance, 1),
            'estimated_reward': round(float(candidate.money) * 0.15, 2),
        })

    return Response(result)


urlpatterns = [
    path('attack/<int:defender_id>/', attack, name='attack'),
    path('history/', battle_history, name='battle-history'),
    path('targets/', targets, name='battle-targets'),
]
