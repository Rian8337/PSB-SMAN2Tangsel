import { SubjectService } from "@/services";
import { ConflictError, NotFoundError } from "@/types";
import { Subject } from "@psb/shared/types";
import { mockSubjectRepository } from "@test/mocks";

describe("SubjectService (unit)", () => {
    const service = new SubjectService(mockSubjectRepository);

    const mockSubject: Subject = {
        id: 1,
        active: true,
        code: "MA101",
        name: "Matematika",
    };

    describe("findById", () => {
        it("should return subject for valid ID", async () => {
            mockSubjectRepository.getById.mockResolvedValue(mockSubject);

            const result = await service.findById(1);

            expect(mockSubjectRepository.getById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockSubject);
        });

        it("should throw for non-existent ID", async () => {
            mockSubjectRepository.getById.mockResolvedValue(null);

            await expect(service.findById(999)).rejects.toThrow(
                new NotFoundError("subjectService.subjectNotFound"),
            );
        });
    });

    describe("findByCode", () => {
        it("should return subject for valid code", async () => {
            mockSubjectRepository.getByCode.mockResolvedValue(mockSubject);

            const result = await service.findByCode("MA101");

            expect(mockSubjectRepository.getByCode).toHaveBeenCalledWith(
                "MA101",
            );

            expect(result).toEqual(mockSubject);
        });

        it("should throw for non-existent code", async () => {
            mockSubjectRepository.getByCode.mockResolvedValue(null);

            await expect(service.findByCode("NONEXISTENT")).rejects.toThrow(
                new NotFoundError("subjectService.subjectNotFound"),
            );
        });
    });

    describe("createSubject", () => {
        it("should create a subject if the code is unique", async () => {
            mockSubjectRepository.getByCode.mockResolvedValue(null);

            await service.createSubject("MA101", "Matematika");

            expect(mockSubjectRepository.create).toHaveBeenCalledWith(
                "MA101",
                "Matematika",
            );
        });

        it("should throw if the code already exists", async () => {
            mockSubjectRepository.getByCode.mockResolvedValue(mockSubject);

            await expect(
                service.createSubject("MA101", "Matematika"),
            ).rejects.toThrow(
                new ConflictError("subjectService.duplicateCode"),
            );
        });
    });

    describe("updateSubject", () => {
        it("should update a subject if the new code is unique", async () => {
            mockSubjectRepository.getById.mockResolvedValue(mockSubject);
            mockSubjectRepository.getByCode.mockResolvedValue(null);

            await service.updateSubject(
                1,
                "MA102",
                "Matematika Lanjutan",
                true,
            );

            expect(mockSubjectRepository.update).toHaveBeenCalledWith(
                1,
                "MA102",
                "Matematika Lanjutan",
                true,
            );
        });

        it("should update a subject if the new code is the same as the current code", async () => {
            mockSubjectRepository.getById.mockResolvedValue(mockSubject);

            await service.updateSubject(
                1,
                "MA101",
                "Matematika Lanjutan",
                true,
            );

            expect(mockSubjectRepository.getByCode).not.toHaveBeenCalled();

            expect(mockSubjectRepository.update).toHaveBeenCalledWith(
                1,
                "MA101",
                "Matematika Lanjutan",
                true,
            );
        });

        it("should throw if subject does not exist", async () => {
            mockSubjectRepository.getById.mockResolvedValue(null);

            await expect(
                service.updateSubject(
                    999,
                    "MA102",
                    "Matematika Lanjutan",
                    true,
                ),
            ).rejects.toThrow(
                new NotFoundError("subjectService.subjectNotFound"),
            );
        });

        it("should throw if the new code already exists on another subject", async () => {
            mockSubjectRepository.getById.mockResolvedValue(mockSubject);

            mockSubjectRepository.getByCode.mockResolvedValue({
                ...mockSubject,
                id: 2,
                code: "MA102",
            });

            await expect(
                service.updateSubject(1, "MA102", "Matematika Lanjutan", true),
            ).rejects.toThrow(
                new ConflictError("subjectService.duplicateCode"),
            );
        });
    });

    describe("deleteSubject", () => {
        it("should delete subject with valid ID", async () => {
            mockSubjectRepository.getById.mockResolvedValue(mockSubject);
            mockSubjectRepository.hasClasses.mockResolvedValue(false);

            await service.deleteSubject(1);

            expect(mockSubjectRepository.delete).toHaveBeenCalledWith(1);
        });

        it("should throw if subject does not exist", async () => {
            mockSubjectRepository.getById.mockResolvedValue(null);

            await expect(service.deleteSubject(999)).rejects.toThrow(
                new NotFoundError("subjectService.subjectNotFound"),
            );

            expect(mockSubjectRepository.delete).not.toHaveBeenCalled();
        });

        it("should throw if subject has associated classes", async () => {
            mockSubjectRepository.getById.mockResolvedValue(mockSubject);
            mockSubjectRepository.hasClasses.mockResolvedValue(true);

            await expect(service.deleteSubject(1)).rejects.toThrow(
                new ConflictError(
                    "subjectService.cannotDeleteSubjectWithClasses",
                ),
            );
        });
    });
});
