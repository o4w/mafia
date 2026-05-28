from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path('api/health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('game.urls.auth')),

    # Oyun
    path('api/player/', include('game.urls.player')),
    path('api/venues/', include('game.urls.venues')),
    path('api/quests/', include('game.urls.quests')),
    path('api/battle/', include('game.urls.battle')),
    path('api/leaderboard/', include('game.urls.leaderboard')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
