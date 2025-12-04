import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  const email = 'test@example.com';
  const password = 'Password123!';

  const user = await userRepository.findOne({ where: { email } });
  if (user) {
    console.log(`Found user: ${user.email}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update entity and save
    user.password = hashedPassword;
    await userRepository.save(user);
    
    console.log('✅ Password updated successfully using save().');
  } else {
    console.error('❌ User not found!');
  }

  await app.close();
}

bootstrap();
