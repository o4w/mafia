from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..models import Player
from ..serializers import LeaderboardSerializer


@api_view(['GET'])
def leaderboard(request):
    sort_by = request.query_params.get('sort', 'level')
    allowed = {'level': '-level', 'money': '-money', 'power': '-power'}
    order = allowed.get(sort_by, '-level')

    players = Player.objects.select_related('user').order_by(order)[:100]

    result = []
    for rank, player in enumerate(players, start=1):
        s = LeaderboardSerializer(player, context={'rank': rank})
        result.append(s.data)

    return Response(result)


urlpatterns = [
    path('', leaderboard, name='leaderboard'),
]
