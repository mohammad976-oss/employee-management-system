package com.ems.repository;

import com.ems.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEmployee_Id(Long employeeId);

    List<Attendance> findByEmployee_IdAndAttendanceDateBetween(Long employeeId, LocalDate start, LocalDate end);

    List<Attendance> findByAttendanceDate(LocalDate date);

    Optional<Attendance> findByEmployee_IdAndAttendanceDate(Long employeeId, LocalDate date);
}
