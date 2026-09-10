"use server";
import { DEPARTMENT_SECTION_CONFIGS } from "@/components/admin/department-sections/departmentSection.core.mjs";
import { createDepartmentTraining, deleteDepartmentTraining, loadDepartmentSectionMediaPicker, saveDepartmentSection, updateDepartmentTraining, uploadDepartmentSectionMedia } from "@/components/admin/department-sections/departmentSection.operations";
const config = DEPARTMENT_SECTION_CONFIGS.gymnastikdamen;
export async function saveDepartmentSectionAction(input) { return saveDepartmentSection(config, input); }
export async function createDepartmentTrainingAction(input) { return createDepartmentTraining(config, input); }
export async function updateDepartmentTrainingAction(id, input) { return updateDepartmentTraining(config, id, input); }
export async function deleteDepartmentTrainingAction(id) { return deleteDepartmentTraining(config, id); }
export async function loadDepartmentSectionMediaPickerAction(filters) { return loadDepartmentSectionMediaPicker(config, filters); }
export async function uploadDepartmentSectionMediaAction(formData) { return uploadDepartmentSectionMedia(config, formData); }
