from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..models import Player
from ..serializers import PlayerSerializer


@api_view(['GET'])
def player_detail(request):
    player = request.user.player
    player.regenerate_energy()
    serializer = PlayerSerializer(player)
    return Response(serializer.data)


urlpatterns = [
    path('', player_detail, name='player-detail'),
]
