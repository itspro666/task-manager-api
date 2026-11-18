package com.example.taskmanager.config;

import com.example.taskmanager.entity.Category;
import com.example.taskmanager.entity.Task;
import com.example.taskmanager.entity.TaskStatus;
import com.example.taskmanager.repository.CategoryRepository;
import com.example.taskmanager.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/** Inserts a little sample data on startup so the API has something to show. */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final TaskRepository taskRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            return;
        }

        Category study = categoryRepository.save(Category.builder().name("Study").build());
        Category personal = categoryRepository.save(Category.builder().name("Personal").build());

        taskRepository.save(Task.builder()
                .title("Finish Spring Boot project")
                .description("Complete the Task Manager API and push it to GitHub")
                .status(TaskStatus.IN_PROGRESS)
                .dueDate(LocalDate.now().plusDays(7))
                .category(study)
                .build());

        taskRepository.save(Task.builder()
                .title("Practice JPA relationships")
                .status(TaskStatus.TODO)
                .category(study)
                .build());

        taskRepository.save(Task.builder()
                .title("Plan the week")
                .status(TaskStatus.DONE)
                .category(personal)
                .build());

        log.info("Sample data loaded");
    }
}
