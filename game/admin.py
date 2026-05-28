from django.contrib import admin
from .models import Player, VenueType, Venue, QuestTemplate, PlayerQuest, BattleLog


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('user', 'level', 'money', 'power', 'energy', 'is_vip', 'created_at')
    list_filter = ('is_vip', 'level')
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(VenueType)
class VenueTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'base_income', 'base_upgrade_cost', 'min_player_level')
    list_filter = ('category',)


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ('player', 'venue_type', 'level', 'is_constructing', 'is_upgrading')
    list_filter = ('is_constructing', 'is_upgrading')
    search_fields = ('player__user__username',)


@admin.register(QuestTemplate)
class QuestTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'energy_cost', 'money_reward_min', 'money_reward_max', 'xp_reward', 'min_player_level', 'is_active')
    list_filter = ('is_active',)


@admin.register(PlayerQuest)
class PlayerQuestAdmin(admin.ModelAdmin):
    list_display = ('player', 'quest_template', 'total_completed', 'last_completed_at')


@admin.register(BattleLog)
class BattleLogAdmin(admin.ModelAdmin):
    list_display = ('attacker', 'defender', 'result', 'money_transferred', 'created_at')
    list_filter = ('result',)
    readonly_fields = ('created_at',)
