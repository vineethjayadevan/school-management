import React from 'react';
import { Edit2 } from 'lucide-react';

const PreviewSection = ({ title, onEdit, children }) => (
    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            {onEdit && (
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium"
                >
                    <Edit2 size={16} />
                    Edit
                </button>
            )}
        </div>
        <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                {children}
            </dl>
        </div>
    </div>
);

const DetailItem = ({ label, value }) => (
    <div className="sm:col-span-1">
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 font-medium">{value || '-'}</dd>
    </div>
);

export default function AdmissionPreview({ formData, onEdit }) {
    if (!formData) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Student Information */}
            <PreviewSection title="Student Information" onEdit={() => onEdit(1)}>
                <DetailItem label="Application No" value={formData.applicationNo} />
                <DetailItem label="Admission No" value={formData.admissionNo} />
                <DetailItem label="Submission Date" value={formData.submissionDate} />
                <DetailItem label="Full Name" value={`${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`} />
                <DetailItem label="Date of Birth" value={formData.dob} />
                <DetailItem label="Gender" value={formData.gender} />
                <DetailItem label="Class" value={`${formData.class} ${formData.section ? '- ' + formData.section : ''}`} />
                <DetailItem label="Blood Group" value={formData.bloodGroup} />
                <DetailItem label="Category" value={formData.category} />
                <DetailItem label="Religion" value={formData.religion} />
                <DetailItem label="Caste" value={formData.caste} />
                <DetailItem label="Nationality" value={formData.nationality} />
                <DetailItem label="Aadhar No" value={formData.aadharNo} />
                <DetailItem label="Place of Birth" value={formData.placeOfBirth} />
            </PreviewSection>

            {/* Previous Education */}
            {(formData.previousSchool || formData.previousClass) && (
                <PreviewSection title="Previous Education" onEdit={() => onEdit(1)}>
                    <DetailItem label="Previous School" value={formData.previousSchool} />
                    <DetailItem label="Previous Class" value={formData.previousClass} />
                    <DetailItem label="Medium" value={formData.mediumOfInstruction} />
                </PreviewSection>
            )}

            {/* Health Information */}
            {(formData.hasLearningDisability || formData.hasMedicalCondition || formData.hasAllergy) && (
                <PreviewSection title="Health & Other Details" onEdit={() => onEdit(1)}>
                    {formData.hasLearningDisability && <div className="md:col-span-2"><DetailItem label="Learning Disabilities" value={formData.learningDisabilityDetails} /></div>}
                    {formData.hasMedicalCondition && <div className="md:col-span-2"><DetailItem label="Medical Conditions" value={formData.medicalConditionDetails} /></div>}
                    {formData.hasAllergy && <div className="md:col-span-2"><DetailItem label="Allergies" value={formData.allergyDetails} /></div>}
                </PreviewSection>
            )}

            {/* Parent Information */}
            <PreviewSection title="Parent Information" onEdit={() => onEdit(2)}>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 pb-4 mb-4">
                    <div className="col-span-2 font-medium text-slate-700">Father's Details</div>
                    <DetailItem label="Name" value={formData.fatherName} />
                    <DetailItem label="Mobile" value={formData.fatherMobile} />
                    <DetailItem label="Email" value={formData.fatherEmail} />
                    <DetailItem label="Occupation" value={formData.fatherOccupation} />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 font-medium text-slate-700">Mother's Details</div>
                    <DetailItem label="Name" value={formData.motherName} />
                    <DetailItem label="Mobile" value={formData.motherMobile} />
                    <DetailItem label="Email" value={formData.motherEmail} />
                    <DetailItem label="Occupation" value={formData.motherOccupation} />
                </div>
            </PreviewSection>

            {/* Guardian Information */}
            {formData.isGuardian && (
                <PreviewSection title="Guardian Information" onEdit={() => onEdit(2)}>
                    <DetailItem label="Name" value={formData.guardianName} />
                    <DetailItem label="Relationship" value={formData.guardianRelation} />
                    <DetailItem label="Phone" value={formData.guardianPhone} />
                    <DetailItem label="Occupation" value={formData.guardianOccupation} />
                    <DetailItem label="Address" value={formData.guardianAddress} />
                </PreviewSection>
            )}

            {/* Address Information */}
            <PreviewSection title="Address Details" onEdit={() => onEdit(2)}>
                <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-slate-500">Residential Address</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                        {formData.resHouseNo}, {formData.resStreet}, {formData.resLocality}<br />
                        {formData.resCity}, {formData.resState} - {formData.resPinCode}
                    </dd>
                </div>
                <div className="md:col-span-2 mt-4">
                    <dt className="text-sm font-medium text-slate-500">Permanent Address</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                        {formData.sameAsResidential ? 'Same as Residential Address' : (
                            <>
                                {formData.permHouseNo}, {formData.permStreet}, {formData.permLocality}<br />
                                {formData.permCity}, {formData.permState} - {formData.permPinCode}
                            </>
                        )}
                    </dd>
                </div>
            </PreviewSection>

            {/* Emergency Contact */}
            <PreviewSection title="Emergency Contact" onEdit={() => onEdit(2)}>
                <DetailItem label="Name" value={formData.emergencyName} />
                <DetailItem label="Relationship" value={formData.emergencyRelation} />
                <DetailItem label="Phone" value={formData.emergencyPhone} />
            </PreviewSection>

            {/* Transport Information */}
            <PreviewSection title="Transportation" onEdit={() => onEdit(2)}>
                <DetailItem label="Mode" value={formData.transportMode} />
                {formData.transportMode === 'School Bus' && (
                    <>
                        <DetailItem label="Route No" value={formData.routeNumber} />
                        <DetailItem label="Pickup Point" value={formData.pickupPoint} />
                        <DetailItem label="Drop Point" value={formData.dropPoint} />
                    </>
                )}
            </PreviewSection>
        </div>
    );
}
