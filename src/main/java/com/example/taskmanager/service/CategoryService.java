package com.example.taskmanager.service;

import com.example.taskmanager.dto.CategoryRequest;
import com.example.taskmanager.dto.CategoryResponse;
import com.example.taskmanager.entity.Category;
import com.example.taskmanager.exception.ConflictException;
import com.example.taskmanager.exception.ResourceNotFoundException;
import com.example.taskmanager.repository.CategoryRepository;
import com.example.taskmanager.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TaskRepository taskRepository;

    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new ConflictException("Category already exists: " + request.getName());
        }
        Category saved = categoryRepository.save(Category.builder().name(request.getName()).build());
        log.info("Created category with id {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found with id " + id);
        }
        if (taskRepository.existsByCategoryId(id)) {
            throw new ConflictException("Cannot delete a category that still has tasks");
        }
        categoryRepository.deleteById(id);
        log.info("Deleted category with id {}", id);
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }
}
