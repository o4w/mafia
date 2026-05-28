from celery import shared_task
from django.utils import timezone


@shared_task
def process_venue_completions():
    """Tamamlanan inşaat ve yükseltmeleri işler."""
    from .models import Venue
    now = timezone.now()

    # Tamamlanan inşaatlar
    constructions = Venue.objects.filter(
        is_constructing=True,
        construction_finish_at__lte=now,
    )
    for venue in constructions:
        venue.finish_construction()

    # Tamamlanan yükseltmeler
    upgrades = Venue.objects.filter(
        is_upgrading=True,
        upgrade_finish_at__lte=now,
    )
    for venue in upgrades:
        venue.finish_upgrade()

    return f"{constructions.count()} inşaat, {upgrades.count()} yükseltme tamamlandı."


@shared_task
def regenerate_all_energy():
    """Tüm oyuncuların enerjisini yeniler (her 5 dakikada)."""
    from .models import Player
    players = Player.objects.filter(energy__lt=models_max_energy())
    count = 0
    for player in players:
        if player.energy < player.max_energy:
            player.regenerate_energy()
            count += 1
    return f"{count} oyuncunun enerjisi yenilendi."


def models_max_energy():
    from django.conf import settings
    return settings.GAME_MAX_ENERGY
