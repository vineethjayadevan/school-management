const mongoose = require('mongoose');
const XLSX = require('xlsx');

// MongoDB Connection URI
const MONGODB_URI = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

const studentSchema = new mongoose.Schema({
    admissionNo: String,
    monthlyConveyanceFee: Number,
    busNumber: String
}, { strict: false });

const Student = mongoose.model('Student', studentSchema);

async function importData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const workbook = XLSX.readFile('C:\\Users\\vinee\\Downloads\\VEHICLE LIST FULL 26-27.xlsx');
        
        let currentBusNumber = null;
        let updateCount = 0;
        let notFound = 0;

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            for (const row of data) {
                if (row.length === 0 || !row[0]) continue;
                
                const col1 = String(row[0]).trim();
                
                if (col1.toUpperCase().startsWith('BUS NO')) {
                    currentBusNumber = col1;
                    continue;
                }

                // Match format: Name ( 1234 )
                const match = col1.match(/(.*?)\s*\(\s*(\d+)\s*\)/);
                if (match) {
                    const admissionNo = match[2].trim();
                    const monthlyFee = Number(row[1]) || 0;
                    
                    const result = await Student.updateOne(
                        { admissionNo: admissionNo },
                        { 
                            $set: { 
                                monthlyConveyanceFee: monthlyFee,
                                busNumber: currentBusNumber
                            }
                        }
                    );

                    if (result.matchedCount > 0) {
                        updateCount++;
                        console.log(`Updated: Adm ${admissionNo} - Fee: ${monthlyFee} - Bus: ${currentBusNumber}`);
                    } else {
                        notFound++;
                        console.log(`NOT FOUND: Adm ${admissionNo}`);
                    }
                }
            }
        }

        console.log(`\nImport complete!`);
        console.log(`Successfully updated: ${updateCount} students`);
        console.log(`Not found in DB: ${notFound} students`);

    } catch (error) {
        console.error('Error during import:', error);
    } finally {
        await mongoose.disconnect();
    }
}

importData();
