import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users/entities/user.entity';
import { Task } from './tasks/entities/task.entity';
import { TimerSession, SessionStatus } from './timer/entities/timer-session.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepository = dataSource.getRepository(User);
  const taskRepository = dataSource.getRepository(Task);
  const sessionRepository = dataSource.getRepository(TimerSession);

  console.log('🌱 Starting seeding...');

  // 1. Create Test User
  const email = 'test@example.com';
  let user = await userRepository.findOne({ where: { email } });

  if (!user) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    user = userRepository.create({
      email,
      password: hashedPassword,
      name: 'Test User',
    });
    await userRepository.save(user);
    console.log('✅ Created user: test@example.com / password123');
  } else {
    console.log('ℹ️ User already exists');
  }

  // 2. Create Tasks
  const taskNames = [
    { title: '코딩 공부', color: '#3b82f6', icon: 'code' },
    { title: '알고리즘', color: '#ef4444', icon: 'terminal' },
    { title: '영어 독해', color: '#10b981', icon: 'book' },
    { title: '운동', color: '#f59e0b', icon: 'dumbbell' },
    { title: '사이드 프로젝트', color: '#8b5cf6', icon: 'rocket' },
  ];

  const tasks: Task[] = [];
  for (const t of taskNames) {
    let task = await taskRepository.findOne({
      where: { title: t.title, user: { id: user.id } },
    });

    if (!task) {
      task = taskRepository.create({
        title: t.title,
        color: t.color,
        icon: t.icon,
        user,
        totalTime: 0,
      });
      await taskRepository.save(task);
    }
    tasks.push(task);
  }
  console.log(`✅ ensured ${tasks.length} tasks`);

  // 3. Generate Timer Sessions (Past 90 days)
  console.log('⏳ Generating sessions for the last 90 days...');
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  let totalCreated = 0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Randomly skip some days (realistic behavior)
    if (Math.random() > 0.8) continue; 

    // 2 to 5 sessions per day
    const sessionsPerDay = Math.floor(Math.random() * 4) + 2;

    for (let i = 0; i < sessionsPerDay; i++) {
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      
      // Random start time between 08:00 and 22:00
      const startHour = Math.floor(Math.random() * 14) + 8; 
      const startMinute = Math.floor(Math.random() * 60);
      
      const sessionStart = new Date(d);
      sessionStart.setHours(startHour, startMinute, 0, 0);

      // Duration: 20 mins to 120 mins
      const durationMinutes = Math.floor(Math.random() * 100) + 20;
      const durationSeconds = durationMinutes * 60;
      
      const sessionEnd = new Date(sessionStart.getTime() + durationSeconds * 1000);

      const session = sessionRepository.create({
        user,
        task,
        startTime: sessionStart,
        endTime: sessionEnd,
        status: SessionStatus.COMPLETED,
        duration: durationSeconds,
        totalPauseTime: 0, // Simplify: no pauses for bulk data
        pauseCount: 0,
      });

      await sessionRepository.save(session);

      // Update Task Total Time
      // Handle bigint type which might be returned as string by TypeORM
      task.totalTime = Number(task.totalTime) + durationSeconds;
      await taskRepository.save(task);

      totalCreated++;
    }
  }

  console.log(`✅ Successfully created ${totalCreated} timer sessions.`);
  console.log('🎉 Seeding complete!');
  await app.close();
}

bootstrap();
