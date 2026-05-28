from django.core.management.base import BaseCommand
from game.models import VenueType, QuestTemplate


class Command(BaseCommand):
    help = 'Oyun için başlangıç verilerini yükler'

    def handle(self, *args, **kwargs):
        self.seed_venue_types()
        self.seed_quests()
        self.stdout.write(self.style.SUCCESS('Başlangıç verileri yüklendi!'))

    def seed_venue_types(self):
        venues = [
            dict(name='Gizli Sığınak', category='DEFENSE', icon_class='shield',
                 base_income=400, base_upgrade_cost=8000, base_upgrade_duration=3600,
                 income_multiplier=1.5, cost_multiplier=2.0, min_player_level=1),
            dict(name='Silah Atölyesi', category='COMBAT', icon_class='sword',
                 base_income=600, base_upgrade_cost=10000, base_upgrade_duration=7200,
                 income_multiplier=1.6, cost_multiplier=2.2, min_player_level=1),
            dict(name='Kumarhane', category='INCOME', icon_class='diamond',
                 base_income=1200, base_upgrade_cost=25000, base_upgrade_duration=14400,
                 income_multiplier=1.7, cost_multiplier=2.5, min_player_level=5),
            dict(name='Liman Deposu', category='INCOME', icon_class='anchor',
                 base_income=800, base_upgrade_cost=15000, base_upgrade_duration=10800,
                 income_multiplier=1.5, cost_multiplier=2.0, min_player_level=3),
            dict(name='Kara Para Aklama Bürosu', category='SPECIAL', icon_class='briefcase',
                 base_income=2000, base_upgrade_cost=50000, base_upgrade_duration=28800,
                 income_multiplier=1.8, cost_multiplier=3.0, min_player_level=10),
        ]
        for v in venues:
            VenueType.objects.get_or_create(name=v['name'], defaults=v)
        self.stdout.write(f'  {len(venues)} bina tipi eklendi.')

    def seed_quests(self):
        quests = [
            dict(name='Araba Çal', description='Sokaktan bir araç çal.',
                 icon_class='car', energy_cost=1,
                 money_reward_min=150, money_reward_max=350, xp_reward=10,
                 cooldown_seconds=0, min_player_level=1),
            dict(name='Haraç Topla', description='Esnaftan haraç topla.',
                 icon_class='cash', energy_cost=1,
                 money_reward_min=200, money_reward_max=400, xp_reward=12,
                 cooldown_seconds=60, min_player_level=1),
            dict(name='Uyuşturucu Taşı', description='Sevkiyatı güvenle ulaştır.',
                 icon_class='package', energy_cost=2,
                 money_reward_min=500, money_reward_max=800, xp_reward=25,
                 cooldown_seconds=300, min_player_level=2),
            dict(name='Silah Kaçakçılığı', description='Sınırdan silah geçir.',
                 icon_class='bolt', energy_cost=3,
                 money_reward_min=800, money_reward_max=1200, xp_reward=35,
                 cooldown_seconds=600, min_player_level=4),
            dict(name='Banka Soygunu', description='Şehrin en büyük bankasını soy.',
                 icon_class='building-bank', energy_cost=4,
                 money_reward_min=1000, money_reward_max=2000, xp_reward=50,
                 cooldown_seconds=1800, min_player_level=6),
            dict(name='Kumarhane Baskını', description='Rakip kumarhanesini bas.',
                 icon_class='diamond', energy_cost=5,
                 money_reward_min=2000, money_reward_max=4000, xp_reward=80,
                 cooldown_seconds=3600, min_player_level=10),
        ]
        for q in quests:
            QuestTemplate.objects.get_or_create(name=q['name'], defaults=q)
        self.stdout.write(f'  {len(quests)} görev eklendi.')
