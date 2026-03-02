/**
 * Utility to generate and download CSV reports for attendance
 */
export const downloadAttendanceCSV = (data, reportName = 'Attendance_Report') => {
    if (!data || !data.dates || !data.students) return;

    const { dates, students } = data;

    // Create header row: Roll No, Name, Admission No, [Dates...]
    const headers = ['Roll No', 'Name', 'Admission No', ...dates];

    // Create rows for each student
    const rows = students.map(student => {
        const attendanceRow = dates.map(date => student.attendance[date] || '-');
        return [
            student.rollNo || '-',
            student.name,
            student.admissionNo || '-',
            ...attendanceRow
        ];
    });

    // Combine into CSV string
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];

    // Add Marked By Info if available
    if (data.markedBy) {
        csvContent.push('');
        csvContent.push('MARKING DETAILS (Date: Teacher)');
        dates.forEach(date => {
            if (data.markedBy[date]) {
                csvContent.push(`${date},${data.markedBy[date]}`);
            }
        });
    }

    const finalCsv = csvContent.join('\n');

    // Create download link
    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
