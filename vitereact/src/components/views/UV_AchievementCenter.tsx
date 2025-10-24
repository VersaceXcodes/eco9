<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {data.map(achievement => (
    <AchievementCard key={achievement.id} achievement={achievement} />
  ))}
</div>