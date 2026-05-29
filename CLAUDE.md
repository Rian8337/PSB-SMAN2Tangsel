# Project: PSB SMAN 2 Tangerang Selatan

The content is based on the Software Requirements Specification and Software Design Description of this project.

## About

This project is a web application that centralizes teaching materials, class schedules, and assignments of the State Senior High School 2 of South Tangerang City in Indonesia, allowing students and teachers to access, track, and manage these resources more efficiently.

This project allows students and teachers to access and manage teaching materials, class schedules, and assignments within one platform.

This project allows IT administrators to register students and teachers to it. After registration, they will be able to assign students to their classes, which are distinct for every semester. This project also allows IT administrators to add subjects that will be taught for the semester and assign a class to a subject if the class takes the subject.

This project allows IT administrators to assign registered teachers to the classes and subjects that they teach in the semester. These teachers will be able to manage teaching materials for the classes that they teach and collect assignments that students have submitted.

This project does not provide grading or examination features.

## User Characteristics

### Students

- Expected to have basic computer skills, including familiarity with web-based applications.
- May have varying technical expertise, but will participate in a training program that is arranged by the school with the help of IT administrators based on the end-user documentation that will be given.
- May have accessibility problems, but only minimal ones that do not require special handling from the school or project.
- Will access the project via laptops and mobile devices, primarily using Google Chrome, Microsoft Edge, and Safari.
- Will have to authenticate with their government-issued NISN to gain access to the project.
- Will use the project to access teaching materials and schedule, as well as submitting assignments.

### Teachers

- Expected to have basic computer skills, including familiarity with web-based applications.
- May have varying technical expertise, but will participate in a training program that is arranged by the school with the help of IT administrators based on the end-user documentation that will be given.
- May have accessibility problems, but only minimal ones that do not require special handling from the school or the project.
- Will access the project via laptops and mobile devices, primarily using Google Chrome, Microsoft Edge, and Safari.
- Will have to authenticate with their school-issued staff ID to gain access to the project.
- Will use the project to access and manage teaching materials and assignments, as well as accessing their teaching schedule.

### IT Administrators

- Expected to have intermediate computer skills, including familiarity with web-based applications and using the operating system’s command line interface.
- May have accessibility problems, but only minimal ones that do not require special handling from the school or the project.
- Will access the project through the hardware that they use to run and host the project for installation and maintenance purposes. During other uses, they will access the project via laptops and mobile devices, primarily using Google Chrome, Microsoft Edge, and Safari.
- Will have to authenticate with administrator accounts to access the project. An administrator account will be registered by default during installation, and administrators may add other administrator accounts via the initially registered administrator account.
- Will use the project to manage student and teacher accounts, semesters, subjects, and classes.
- Will receive an end-user documentation to guide them through using the project and arrange a training program with the school to train current and future students and teachers.

## Use Cases

### User Account Module

- UC01 – Change Account Password: Allows students, teachers, and administrators to change the password of their registered account.
- UC02 – Manage User Account: Allows administrators to manage student and teacher accounts. They can add or remove student and teacher accounts, as well as change the account’s name, but not change their identification number or password.

### Academic Module

- UC03 – Manage Semester: Allows administrators to manage (add, edit, or remove) semesters in the system.
- UC04 – Manage Class: Allows administrators to manage classes within a semester. They can add or remove classes within a semester.
- UC05 – Manage Subject: Allows administrators to manage subjects.
- UC06 – Manage Subject in Class: Allows administrators to manage subjects in a class within a semester. They can add or remove subjects that are taken by the class.
- UC07 – Manage Student in Class: Allows administrators to manage students in a class within a semester.
- UC08 – View Registered Subjects: Allows students and teachers to view a list of subjects that they take or teach during a semester.
- UC09 – View Subject: Allows students and teachers to view a subject that they take or teach during a semester. This use case will display the subject’s dashboard with regards to the class of the student or teacher where they can perform further actions.
- UC10 – Manage Subject Material: Allows teachers to manage materials in a class of a subject. They can add, edit, or remove materials and toggle their visibility from students. The material can be an attachment or a link.
- UC11 – View Subject Material: Allows students and teachers to view a material of a subject that is managed by the teacher in the class.

### Assignment Module

- UC12 – View Assignment: Allows students and teachers to view an assignment that is given to a class in a subject. The assignment contains instructions in the form of text, attachments, or links.
- UC13 – Manage Assignment: Allows teachers to manage (add, edit, or remove) assignments in a class of a subject. They can also set the visibility of the assignment from students.
- UC14 – Manage Assignment Submission: Allows students to manage their submission in an assignment in a class of a subject. A submission is in the form of attachments.
- UC15 – View Student Submissions: Allows teachers to view the submissions that students have made to an assignment.
- UC16 – Download Student Submissions: Allows teachers to download one or more submissions from students in an assignment.

### Schedule Module

- UC17 – Manage Class Schedule: Allows administrators to manage the schedule of a class.
- UC18 – View Class Schedule: Allows students and teachers to view their class schedule.
- UC19 – Download Class Schedule: Allows students and teachers to download their class schedule in .ics file format, which allows them to import the schedule into calendar applications.

### Notification Module

- UC20 – View Notifications: Allows students, teachers, and administrators to view their notifications.
- UC21 – Manage Notifications: Allows students, teachers, and administrators to manage their notifications by marking them as read or unread.

## Other Requirements

### Usability

- The system must allow interactivity with mouse input and touchscreen
- The system must provide Indonesian and English translations across all user interfaces

### Compatibility

- The system must be able to function in Chromium-based, Mozilla Firefox, and Safari web browsers
- The system must be designed to run in the Ubuntu 20.04 operating system

### Security

- The system must encrypt user passwords using the bcrypt hashing algorithm
- The system must encrypt user data during transfer in a secure, HTTP-only cookie using the AES-256-CBC hashing algorithm
- The system must employ permission-based access to functionalities that are specific to one or more roles

### Reliability

- The system must have a success rate of at least 99% on all functionalities

## Design Constraints

- The system must only allow passwords that are at least 8 characters long, contain at least 1 uppercase character, and contain at least 1 lowercase character
- The system must be compatible with Ubuntu 20.04 operating system
- The system must only accept files from students and teachers that are at most 100 MB in size

## Design Artifacts

Design artifacts for this project can be found under `./artifacts`. These should be followed as close as possible, with the exception of interface mockups and DTOs, but if new methods or properties are needed, it is fine to add them.

Artifact folders are as follow:

- Class diagrams: `./artifacts/class-diagram`
    - API layer: `./artifacts/class-diagram/API.png`
    - Controller layer: `./artifacts/class-diagram/Application.png`
    - Service layer: `./artifacts/class-diagram/Business.png`
    - Repository layer: `./artifacts/class-diagram/Data Access.png`
    - DTOs: `./artifacts/class-diagram/Data Transfer Objects.png`
- Mockup: `./artifacts/mockup`, but see how other interfaces are implemented for examples
- Sequence diagram: `./artifacts/sequence-diagram` for each scenario (file always starts with numbering, e.g. `UC09 View Subject_SequenceGraph_StudentView.png`).

## Localizations

Localizations are located in two places:

- For frontend, they are in `frontend/messages/` (JSON files)
- For backend, they are in `backend/src/i18n/messages.ts`

After changing localizations in the frontend, run `pnpm typegen` to regenerate the `d.ts` files if localization-related compilation errors appear.

## Implementation Steps

When implementing a new use case, use the following base steps (you can add more if needed):

1. Design DTOs to be shared between the backend and frontend, add to `packages/shared` shared package.
2. Build shared package (`pnpm build-shared`) to update shared package artifacts. When you do this, VS Code's ESLint server may have outdated cache, so its warnings may be incorrect. You may restart its server after the build.
3. Implement backend components (controllers, services, repositories, localizations, validators, types, and dependency injection).
4. Build backend components (`pnpm --filter backend build`).
5. Implement/modify backend unit tests for new endpoints in controllers and new behaviors in services. See existing tests for examples.
6. Implement backend integration tests at controller level (to e.g., verify role-based access controls) and repository level to verify database queries. See existing tests for examples.
7. Run backend tests (`pnpm --filter backend test`) and verify that everything passed.
8. Implement frontend components (API clients, server components (pages), client components, and localizations).
9. Implement/modify frontend unit tests for new components or behaviors. See existing tests for examples.
10. Implement frontend integration tests if needed. See existing tests for examples.
11. Run frontend tests (`pnpm --filter frontend test`) and verify that everything passed.
12. Implement end-to-end tests in frontend. Keep in mind that these tests use Indonesian locale. See existing tests for examples.
13. Run end-to-end tests (just `pnpm --filter frontend test:e2e`) and verify that everything passed.
