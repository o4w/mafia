from django.urls import path
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..models import Venue, VenueType
from ..serializers import VenueSerializer, VenueTypeSerializer


@api_view(['GET'])
def venue_list(request):
    player = request.user.player
    venues = Venue.objects.filter(player=player).select_related('venue_type')

    # Tamamlanan inşaat/yükseltmeleri kontrol et
    now = timezone.now()
    for venue in venues:
        if venue.is_constructing and venue.construction_finish_at and venue.construction_finish_at <= now:
            venue.finish_construction()
        elif venue.is_upgrading and venue.upgrade_finish_at and venue.upgrade_finish_at <= now:
            venue.finish_upgrade()

    total_accumulated = sum(v.accumulated_income for v in venues)
    data = VenueSerializer(venues, many=True).data
    return Response({
        'venues': data,
        'total_accumulated': round(total_accumulated, 2),
        'is_vip': player.is_vip,
    })


@api_view(['POST'])
def collect_income(request, venue_id):
    player = request.user.player
    try:
        venue = Venue.objects.get(id=venue_id, player=player)
    except Venue.DoesNotExist:
        return Response({'error': 'Bina bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

    if not venue.income_available:
        return Response({'error': 'Henüz gelir hazır değil.'}, status=status.HTTP_400_BAD_REQUEST)

    amount = venue.collect_income()
    player.money += amount
    player.save(update_fields=['money'])

    return Response({
        'collected': amount,
        'new_balance': float(player.money),
        'venue': VenueSerializer(venue).data,
    })


@api_view(['POST'])
def upgrade_venue(request, venue_id):
    player = request.user.player
    try:
        venue = Venue.objects.get(id=venue_id, player=player)
    except Venue.DoesNotExist:
        return Response({'error': 'Bina bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

    if venue.is_upgrading or venue.is_constructing:
        return Response({'error': 'Bina zaten işlemde.'}, status=status.HTTP_400_BAD_REQUEST)

    if venue.level >= venue.venue_type.max_level:
        return Response({'error': 'Maksimum seviyeye ulaşıldı.'}, status=status.HTTP_400_BAD_REQUEST)

    cost = venue.upgrade_cost
    if float(player.money) < cost:
        return Response({'error': 'Yeterli para yok.'}, status=status.HTTP_400_BAD_REQUEST)

    player.money -= cost
    player.save(update_fields=['money'])

    duration = venue.upgrade_duration
    venue.is_upgrading = True
    venue.upgrade_finish_at = timezone.now() + timezone.timedelta(seconds=duration)
    venue.save(update_fields=['is_upgrading', 'upgrade_finish_at'])

    return Response({
        'message': 'Yükseltme başladı.',
        'cost': cost,
        'finish_at': venue.upgrade_finish_at,
        'venue': VenueSerializer(venue).data,
    })


@api_view(['POST'])
def build_venue(request):
    player = request.user.player
    venue_type_id = request.data.get('venue_type_id')

    try:
        venue_type = VenueType.objects.get(id=venue_type_id)
    except VenueType.DoesNotExist:
        return Response({'error': 'Bina tipi bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

    if Venue.objects.filter(player=player, venue_type=venue_type).exists():
        return Response({'error': 'Bu binaya zaten sahipsiniz.'}, status=status.HTTP_400_BAD_REQUEST)

    if player.level < venue_type.min_player_level:
        return Response({'error': f'Seviye {venue_type.min_player_level} gerekli.'}, status=status.HTTP_400_BAD_REQUEST)

    cost = float(venue_type.base_upgrade_cost)
    if float(player.money) < cost:
        return Response({'error': 'Yeterli para yok.'}, status=status.HTTP_400_BAD_REQUEST)

    player.money -= cost
    player.save(update_fields=['money'])

    duration = venue_type.base_upgrade_duration
    finish_at = timezone.now() + timezone.timedelta(seconds=duration)
    venue = Venue.objects.create(
        player=player,
        venue_type=venue_type,
        is_constructing=True,
        construction_finish_at=finish_at,
    )

    return Response({
        'message': 'İnşaat başladı.',
        'venue': VenueSerializer(venue).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def available_venue_types(request):
    player = request.user.player
    owned_type_ids = Venue.objects.filter(player=player).values_list('venue_type_id', flat=True)
    types = VenueType.objects.exclude(id__in=owned_type_ids).filter(
        min_player_level__lte=player.level
    )
    return Response(VenueTypeSerializer(types, many=True).data)


urlpatterns = [
    path('', venue_list, name='venue-list'),
    path('<int:venue_id>/collect/', collect_income, name='collect-income'),
    path('<int:venue_id>/upgrade/', upgrade_venue, name='upgrade-venue'),
    path('build/', build_venue, name='build-venue'),
    path('available/', available_venue_types, name='available-venues'),
]
