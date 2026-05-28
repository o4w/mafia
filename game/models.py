from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
import math


class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='player')
    level = models.PositiveIntegerField(default=1)
    xp = models.PositiveIntegerField(default=0)
    money = models.DecimalField(max_digits=15, decimal_places=2, default=2500)
    power = models.PositiveIntegerField(default=100)
    defense = models.PositiveIntegerField(default=50)
    energy = models.PositiveIntegerField(default=10)
    max_energy = models.PositiveIntegerField(default=10)
    last_energy_regen = models.DateTimeField(default=timezone.now)
    is_vip = models.BooleanField(default=False)
    vip_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Oyuncu'
        verbose_name_plural = 'Oyuncular'

    def __str__(self):
        return f"{self.user.username} (Seviye {self.level})"

    @property
    def xp_needed(self):
        return math.floor(100 * (1.5 ** (self.level - 1)))

    def regenerate_energy(self):
        now = timezone.now()
        minutes_passed = (now - self.last_energy_regen).total_seconds() / 60
        regen_amount = int(minutes_passed / settings.GAME_ENERGY_REGEN_MINUTES)
        if regen_amount > 0 and self.energy < self.max_energy:
            self.energy = min(self.max_energy, self.energy + regen_amount)
            self.last_energy_regen = now
            self.save(update_fields=['energy', 'last_energy_regen'])

    def add_xp(self, amount):
        self.xp += amount
        leveled_up = False
        while self.xp >= self.xp_needed:
            self.xp -= self.xp_needed
            self.level += 1
            self.power += 20
            self.defense += 10
            self.max_energy += 1
            self.energy = self.max_energy
            leveled_up = True
        self.save()
        return leveled_up


class VenueType(models.Model):
    CATEGORY_CHOICES = [
        ('INCOME', 'Gelir'),
        ('COMBAT', 'Savaş'),
        ('DEFENSE', 'Savunma'),
        ('SPECIAL', 'Özel'),
    ]
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    icon_class = models.CharField(max_length=50, default='building')
    image = models.ImageField(upload_to='venues/', null=True, blank=True)
    base_income = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    base_upgrade_cost = models.DecimalField(max_digits=10, decimal_places=2, default=5000)
    base_upgrade_duration = models.PositiveIntegerField(default=3600, help_text='Saniye')
    income_multiplier = models.FloatField(default=1.5, help_text='Her seviyede gelir çarpanı')
    cost_multiplier = models.FloatField(default=2.0, help_text='Her seviyede maliyet çarpanı')
    max_level = models.PositiveIntegerField(default=10)
    min_player_level = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = 'Bina Tipi'
        verbose_name_plural = 'Bina Tipleri'

    def __str__(self):
        return self.name


class Venue(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='venues')
    venue_type = models.ForeignKey(VenueType, on_delete=models.PROTECT)
    level = models.PositiveIntegerField(default=1)
    is_constructing = models.BooleanField(default=False)
    construction_finish_at = models.DateTimeField(null=True, blank=True)
    is_upgrading = models.BooleanField(default=False)
    upgrade_finish_at = models.DateTimeField(null=True, blank=True)
    last_income_collected_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Bina'
        verbose_name_plural = 'Binalar'
        unique_together = ('player', 'venue_type')

    def __str__(self):
        return f"{self.player.user.username} - {self.venue_type.name} (Lv{self.level})"

    @property
    def hourly_income(self):
        multiplier = self.venue_type.income_multiplier ** (self.level - 1)
        return float(self.venue_type.base_income) * multiplier

    @property
    def upgrade_cost(self):
        multiplier = self.venue_type.cost_multiplier ** (self.level - 1)
        return float(self.venue_type.base_upgrade_cost) * multiplier

    @property
    def upgrade_duration(self):
        return self.venue_type.base_upgrade_duration * self.level

    @property
    def accumulated_income(self):
        if self.is_constructing or self.is_upgrading:
            return 0.0
        now = timezone.now()
        hours = (now - self.last_income_collected_at).total_seconds() / 3600
        max_hours = settings.GAME_MAX_INCOME_HOURS
        return round(self.hourly_income * min(hours, max_hours), 2)

    @property
    def income_available(self):
        return self.accumulated_income >= 1

    def collect_income(self):
        amount = self.accumulated_income
        self.last_income_collected_at = timezone.now()
        self.save(update_fields=['last_income_collected_at'])
        return amount

    def finish_construction(self):
        self.is_constructing = False
        self.construction_finish_at = None
        self.last_income_collected_at = timezone.now()
        self.save()

    def finish_upgrade(self):
        self.is_upgrading = False
        self.upgrade_finish_at = None
        self.level += 1
        self.last_income_collected_at = timezone.now()
        self.save()


class QuestTemplate(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon_class = models.CharField(max_length=50, default='briefcase')
    energy_cost = models.PositiveIntegerField(default=1)
    money_reward_min = models.DecimalField(max_digits=10, decimal_places=2)
    money_reward_max = models.DecimalField(max_digits=10, decimal_places=2)
    xp_reward = models.PositiveIntegerField(default=10)
    cooldown_seconds = models.PositiveIntegerField(default=0)
    min_player_level = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Görev Şablonu'
        verbose_name_plural = 'Görev Şablonları'

    def __str__(self):
        return self.name


class PlayerQuest(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='quests')
    quest_template = models.ForeignKey(QuestTemplate, on_delete=models.CASCADE)
    last_completed_at = models.DateTimeField(null=True, blank=True)
    total_completed = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Oyuncu Görevi'
        unique_together = ('player', 'quest_template')

    @property
    def is_on_cooldown(self):
        if not self.last_completed_at:
            return False
        from django.utils import timezone
        elapsed = (timezone.now() - self.last_completed_at).total_seconds()
        return elapsed < self.quest_template.cooldown_seconds

    @property
    def cooldown_remaining(self):
        if not self.last_completed_at:
            return 0
        from django.utils import timezone
        elapsed = (timezone.now() - self.last_completed_at).total_seconds()
        remaining = self.quest_template.cooldown_seconds - elapsed
        return max(0, int(remaining))


class BattleLog(models.Model):
    RESULT_CHOICES = [('WIN', 'Kazandı'), ('LOSE', 'Kaybetti')]
    attacker = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='attacks')
    defender = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='defenses')
    result = models.CharField(max_length=4, choices=RESULT_CHOICES)
    money_transferred = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    xp_gained = models.PositiveIntegerField(default=0)
    attacker_power = models.PositiveIntegerField()
    defender_power = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Savaş Kaydı'
        verbose_name_plural = 'Savaş Kayıtları'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.attacker} vs {self.defender} → {self.result}"
