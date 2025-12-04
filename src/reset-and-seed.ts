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

  console.log('🌱 Starting reset and seed...');

  const email = 'test@example.com';
  const password = 'Password123!';

  // 1. Delete existing user
  const existingUser = await userRepository.findOne({ where: { email }, withDeleted: true });
  if (existingUser) {
    console.log(`Deleting existing user: ${email}`);
    // Cascade delete should handle tasks and sessions, but let's be safe or rely on cascade
    await userRepository.remove(existingUser);
  }

  // 2. Create User
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = userRepository.create({
    email,
    password: hashedPassword,
    name: 'Test User',
  });
  await userRepository.save(user);
  console.log(`✅ Created user: ${email} / ${password}`);

  // 3. Create Tasks
  const taskNames = [
    { title: '코딩 공부', color: '#3b82f6', icon: 'code' },
    { title: '알고리즘', color: '#ef4444', icon: 'terminal' },
    { title: '영어 독해', color: '#10b981', icon: 'book' },
  ];

  const tasks: Task[] = [];
  for (const t of taskNames) {
    const task = taskRepository.create({
      title: t.title,
      color: t.color,
      icon: t.icon,
      user,
      totalTime: 0,
    });
    await taskRepository.save(task);
    tasks.push(task);
  }
  console.log(`✅ Created ${tasks.length} tasks`);

  // 4. Generate Timer Sessions (Past 30 days)
  console.log('⏳ Generating sessions...');
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  let totalCreated = 0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (Math.random() > 0.7) continue; // Skip some days

    const sessionsPerDay = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < sessionsPerDay; i++) {
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      const durationMinutes = Math.floor(Math.random() * 60) + 30;
      const durationSeconds = durationMinutes * 60;
      
      const startHour = Math.floor(Math.random() * 12) + 9;
      const sessionStart = new Date(d);
      sessionStart.setHours(startHour, 0, 0, 0);
      const sessionEnd = new Date(sessionStart.getTime() + durationSeconds * 1000);

      const session = sessionRepository.create({
        user,
        task,
        startTime: sessionStart,
        endTime: sessionEnd,
        status: SessionStatus.COMPLETED,
        duration: durationSeconds,
        totalPauseTime: 0,
        pauseCount: 0,
      });

      await sessionRepository.save(session);
      
      // Update total time (number)
      task.totalTime = Number(task.totalTime) + durationSeconds;
      await taskRepository.save(task);

      totalCreated++;
    }
  }

  console.log(`✅ Created ${totalCreated} sessions.`);
  await app.close();
}

bootstrap();
