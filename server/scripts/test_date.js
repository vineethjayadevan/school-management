function excelDateToJSDate(serial) {
    // Excel dates count days from Dec 30 1899
    // Adding the days, keeping in mind timezones might shift it.
    const utcDays = serial - 25569;
    const utcValue = utcDays * 86400000;                                        
    const dateInfo = new Date(utcValue);
    // return dateInfo in readable format
    return dateInfo;
}

console.log('46113 ->', excelDateToJSDate(46113));
