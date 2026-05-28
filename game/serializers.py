from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Player, Venue, VenueType, QuestTemplate, PlayerQuest, BattleLog
import math


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Şifreler eşleşmiyor.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        Player.objects.create(user=user)
        return user


class PlayerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    xp_needed = serializers.IntegerField(read_only=True)
    energy_regen_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = (
            'id', 'username', 'level', 'xp', 'xp_needed',
            'money', 'power', 'defense', 'energy', 'max_energy',
            'energy_regen_seconds', 'is_vip', 'created_at',
        )

    def get_energy_regen_seconds(self, obj):
        from django.conf import settings
        minutes = settings.GAME_ENERGY_REGEN_MINUTES
        elapsed = (timezone.now() - obj.last_energy_regen).total_seconds()
        regen_interval = minutes * 60
        next_regen = regen_interval - (elapsed % regen_interval)
        return int(next_regen)


class VenueTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueType
        fields = ('id', 'name', 'category', 'icon_class', 'image',
                  'base_income', 'min_player_level')


class VenueSerializer(serializers.ModelSerializer):
    venue_type = VenueTypeSerializer(read_only=True)
    hourly_income = serializers.FloatField(read_only=True)
    accumulated_income = serializers.FloatField(read_only=True)
    income_available = serializers.BooleanField(read_only=True)
    upgrade_cost = serializers.FloatField(read_only=True)
    upgrade_duration = serializers.IntegerField(read_only=True)
    construction_progress = serializers.SerializerMethodField()
    upgrade_progress = serializers.SerializerMethodField()
    construction_time_remaining = serializers.SerializerMethodField()
    upgrade_time_remaining = serializers.SerializerMethodField()
    next_level_income = serializers.SerializerMethodField()
    next_income_available_at = serializers.SerializerMethodField()
    next_income_seconds = serializers.SerializerMethodField()
    can_upgrade = serializers.SerializerMethodField()
    next_level_min_player_level = serializers.SerializerMethodField()

    class Meta:
        model = Venue
        fields = (
            'id', 'venue_type', 'level',
            'is_constructing', 'construction_progress', 'construction_finish_at', 'construction_time_remaining',
            'income_available', 'accumulated_income', 'hourly_income',
            'next_income_available_at', 'next_income_seconds',
            'is_upgrading', 'upgrade_progress', 'upgrade_finish_at', 'upgrade_time_remaining',
            'can_upgrade', 'upgrade_cost', 'upgrade_duration',
            'next_level_min_player_level', 'next_level_income',
        )

    def _remaining(self, finish_at):
        if not finish_at:
            return 0
        remaining = (finish_at - timezone.now()).total_seconds()
        return max(0, int(remaining))

    def _progress(self, finish_at, duration):
        if not finish_at or not duration:
            return 0
        elapsed = duration - self._remaining(finish_at)
        return min(100, int((elapsed / duration) * 100))

    def get_construction_time_remaining(self, obj):
        return self._remaining(obj.construction_finish_at)

    def get_upgrade_time_remaining(self, obj):
        return self._remaining(obj.upgrade_finish_at)

    def get_construction_progress(self, obj):
        return self._progress(obj.construction_finish_at, obj.venue_type.base_upgrade_duration)

    def get_upgrade_progress(self, obj):
        return self._progress(obj.upgrade_finish_at, obj.upgrade_duration)

    def get_next_level_income(self, obj):
        mult = obj.venue_type.income_multiplier ** obj.level
        return round(float(obj.venue_type.base_income) * mult, 2)

    def get_next_income_available_at(self, obj):
        if obj.is_upgrading or obj.is_constructing:
            return None
        from django.conf import settings
        hours = settings.GAME_INCOME_INTERVAL_HOURS
        next_time = obj.last_income_collected_at + timezone.timedelta(hours=hours)
        return next_time.isoformat() if next_time > timezone.now() else None

    def get_next_income_seconds(self, obj):
        if obj.is_upgrading or obj.is_constructing:
            return 0
        from django.conf import settings
        hours = settings.GAME_INCOME_INTERVAL_HOURS
        next_time = obj.last_income_collected_at + timezone.timedelta(hours=hours)
        remaining = (next_time - timezone.now()).total_seconds()
        return max(0, int(remaining))

    def get_can_upgrade(self, obj):
        if obj.is_upgrading or obj.is_constructing:
            return False
        if obj.level >= obj.venue_type.max_level:
            return False
        player = obj.player
        return float(player.money) >= obj.upgrade_cost

    def get_next_level_min_player_level(self, obj):
        return obj.venue_type.min_player_level + obj.level


class QuestTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestTemplate
        fields = ('id', 'name', 'description', 'icon_class', 'energy_cost',
                  'money_reward_min', 'money_reward_max', 'xp_reward',
                  'cooldown_seconds', 'min_player_level')


class PlayerQuestSerializer(serializers.ModelSerializer):
    quest = QuestTemplateSerializer(source='quest_template', read_only=True)
    is_on_cooldown = serializers.BooleanField(read_only=True)
    cooldown_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = PlayerQuest
        fields = ('id', 'quest', 'last_completed_at', 'total_completed',
                  'is_on_cooldown', 'cooldown_remaining')


class BattleLogSerializer(serializers.ModelSerializer):
    attacker_name = serializers.CharField(source='attacker.user.username', read_only=True)
    defender_name = serializers.CharField(source='defender.user.username', read_only=True)

    class Meta:
        model = BattleLog
        fields = ('id', 'attacker_name', 'defender_name', 'result',
                  'money_transferred', 'xp_gained', 'attacker_power',
                  'defender_power', 'created_at')


class LeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    rank = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = ('rank', 'username', 'level', 'money', 'power', 'is_vip')

    def get_rank(self, obj):
        return self.context.get('rank', 0)
