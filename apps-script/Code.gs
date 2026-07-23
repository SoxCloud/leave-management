const CONFIG = {
  SHEET_NAMES: {
    LEARNERS: 'Learners',
    LEAVE_REQUESTS: 'LeaveRequests',
    LEAVE_BALANCES: 'LeaveBalances',
    ABSENTEEISM: 'Absenteeism',
    USERS: 'Users',
    AUDIT_LOG: 'AuditLog',
    SETTINGS: 'Settings',
  },
  HEADERS: {
    LEARNERS: ['Full Name', 'Department', 'Campaign', 'Site', 'Supervisor', 'Manager', 'Start Date', 'Expected End Date', 'Status', 'Phone', 'Email'],
    LEAVE_REQUESTS: ['Request ID', 'Learner Name', 'Leave Type', 'Start Date', 'End Date', 'Days Requested', 'Reason', 'Medical Certificate', 'Document Link', 'Approved By', 'Approval Date', 'Status', 'Comments'],
    LEAVE_BALANCES: ['Learner Name', 'Days Accrued', 'Annual Leave Taken', 'Annual Balance', 'Sick Leave Used', 'Family Responsibility Used', 'Last Updated'],
    ABSENTEEISM: ['Date', 'Learner Name', 'Attendance Status', 'Authorised', 'Reason', 'Captured By', 'Supervisor', 'Manager', 'Comments'],
    USERS: ['ID', 'Email', 'Name', 'Role', 'Password', 'Department'],
    AUDIT_LOG: ['ID', 'User', 'Date', 'Time', 'Action', 'Old Value', 'New Value', 'IP'],
    SETTINGS: ['Setting', 'Value'],
  },
};

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function initializeSheets_() {
  Object.entries(CONFIG.SHEET_NAMES).forEach(([key, name]) => {
    getOrCreateSheet_(name, CONFIG.HEADERS[key]);
  });
}

function doGet(e) {
  initializeSheets_();
  const action = e.parameter.action || '';
  const sheet = e.parameter.sheet || '';

  try {
    let result;

    switch (action) {
      case 'getSheet':
        result = getSheetData_(sheet);
        break;
      case 'getStats':
        result = getDashboardStats_();
        break;
      case 'getChartData':
        result = getChartData_();
        break;
      default:
        result = { success: true, message: 'LeaveHub API is running' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  initializeSheets_();
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || '';
    let result;

    switch (action) {
      case 'addRow':
        result = addRow_(data.sheet, data.row);
        break;
      case 'updateRow':
        result = updateRow_(data.sheet, data.idColumn, data.id, data.column, data.value);
        break;
      case 'addLearner':
        result = addLearner_(data);
        break;
      case 'addLeaveRequest':
        result = addLeaveRequest_(data);
        break;
      case 'approveLeave':
        result = approveLeave_(data.id, data.approvedBy);
        break;
      case 'rejectLeave':
        result = rejectLeave_(data.id, data.comments);
        break;
      case 'captureAttendance':
        result = captureAttendance_(data);
        break;
      case 'addUser':
        result = addUser_(data);
        break;
      case 'logAudit':
        result = logAudit_(data);
        break;
      case 'recalculateBalances':
        result = recalculateAllBalances_();
        break;
      default:
        result = { success: false, message: 'Unknown action' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData_(sheetName) {
  const sheet = getOrCreateSheet_(sheetName, CONFIG.HEADERS[sheetName] || []);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { headers: data[0] || [], rows: [] };
  return {
    headers: data[0],
    rows: data.slice(1).filter(row => row[0] && String(row[0]).trim() !== ''),
  };
}

function addRow_(sheetName, rowData) {
  const sheet = getOrCreateSheet_(sheetName, CONFIG.HEADERS[sheetName] || []);
  sheet.appendRow(rowData);
  logAudit_({ user: 'System', action: 'Added row to ' + sheetName, oldValue: '', newValue: JSON.stringify(rowData) });
  return { success: true, message: 'Row added successfully' };
}

function updateRow_(sheetName, idColumn, id, column, value) {
  const sheet = getOrCreateSheet_(sheetName, CONFIG.HEADERS[sheetName] || []);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      const oldValue = String(data[i][column]);
      sheet.getRange(i + 1, column + 1).setValue(value);
      logAudit_({ user: 'System', action: 'Updated ' + sheetName, oldValue: oldValue, newValue: value });
      return { success: true, message: 'Row updated' };
    }
  }
  return { success: false, message: 'Row not found' };
}

function addLearner_(data) {
  const sheet = getOrCreateSheet_('Learners', CONFIG.HEADERS.LEARNERS);
  const row = [
    data.fullName || '',
    data.department || '',
    data.campaign || '',
    data.site || '',
    data.supervisor || '',
    data.manager || '',
    data.startDate || '',
    data.expectedEndDate || '',
    data.status || 'Active',
    data.phone || '',
    data.email || '',
  ];
  sheet.appendRow(row);

  const balanceSheet = getOrCreateSheet_('LeaveBalances', CONFIG.HEADERS.LEAVE_BALANCES);
  balanceSheet.appendRow([data.fullName || '', '0', '0', '0', '0', '0', new Date().toISOString()]);

  logAudit_({ user: data.user || 'System', action: 'Added learner', oldValue: '', newValue: data.fullName });
  return { success: true, learnerName: data.fullName };
}

function getLearnerByName_(name) {
  const sheet = getOrCreateSheet_('Learners', CONFIG.HEADERS.LEARNERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === name.toLowerCase()) {
      const headers = data[0];
      const row = data[i];
      const learner = {};
      headers.forEach(function(h, idx) { learner[h] = row[idx]; });
      return learner;
    }
  }
  return null;
}

function addLeaveRequest_(data) {
  const sheet = getOrCreateSheet_('LeaveRequests', CONFIG.HEADERS.LEAVE_REQUESTS);
  const existingData = sheet.getDataRange().getValues();
  const newStart = new Date(data.startDate).getTime();
  const newEnd = new Date(data.endDate).getTime();

  for (let i = 1; i < existingData.length; i++) {
    const row = existingData[i];
    if (String(row[1]).toLowerCase() === (data.learnerName || '').toLowerCase() && String(row[11]) === 'Approved') {
      const existingStart = new Date(String(row[3])).getTime();
      const existingEnd = new Date(String(row[4])).getTime();
      if (newStart <= existingEnd && newEnd >= existingStart) {
        return { success: false, error: 'Overlapping leave detected' };
      }
    }
  }

  const requestId = generateId_('LRQ');
  const row = [
    requestId,
    data.learnerName || '',
    data.leaveType || 'Annual',
    data.startDate,
    data.endDate,
    data.daysRequested || 0,
    data.reason || '',
    data.medicalCertificate ? 'Yes' : 'No',
    data.documentLink || '',
    '',
    '',
    'Pending',
    data.comments || '',
  ];
  sheet.appendRow(row);

  logAudit_({ user: data.user || 'System', action: 'Leave request created', oldValue: '', newValue: requestId });
  return { success: true, requestId: requestId };
}

function approveLeave_(id, approvedBy) {
  const sheet = getOrCreateSheet_('LeaveRequests', CONFIG.HEADERS.LEAVE_REQUESTS);
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString().split('T')[0];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.getRange(i + 1, 10).setValue(approvedBy);
      sheet.getRange(i + 1, 11).setValue(now);
      sheet.getRange(i + 1, 12).setValue('Approved');

      recalculateBalances_(String(data[i][1]));

      logAudit_({ user: approvedBy, action: 'Approved leave', oldValue: 'Pending', newValue: 'Approved' });
      return { success: true, message: 'Leave approved' };
    }
  }
  return { success: false, error: 'Request not found' };
}

function rejectLeave_(id, comments) {
  const sheet = getOrCreateSheet_('LeaveRequests', CONFIG.HEADERS.LEAVE_REQUESTS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.getRange(i + 1, 12).setValue('Rejected');
      if (comments) sheet.getRange(i + 1, 13).setValue(comments);

      logAudit_({ user: 'System', action: 'Rejected leave', oldValue: 'Pending', newValue: 'Rejected' });
      return { success: true, message: 'Leave rejected' };
    }
  }
  return { success: false, error: 'Request not found' };
}

function captureAttendance_(data) {
  const sheet = getOrCreateSheet_('Absenteeism', CONFIG.HEADERS.ABSENTEEISM);

  const existingData = sheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    if (String(existingData[i][0]) === data.date && String(existingData[i][1]).toLowerCase() === (data.learnerName || '').toLowerCase()) {
      sheet.getRange(i + 1, 3).setValue(data.attendanceStatus || 'Present');
      sheet.getRange(i + 1, 4).setValue(data.authorised ? 'Yes' : 'No');
      sheet.getRange(i + 1, 5).setValue(data.reason || '');
      sheet.getRange(i + 1, 6).setValue(data.capturedBy || '');
      sheet.getRange(i + 1, 9).setValue(data.comments || '');
      logAudit_({ user: data.capturedBy || 'System', action: 'Updated attendance', oldValue: '', newValue: JSON.stringify(data) });
      return { success: true, message: 'Attendance updated' };
    }
  }

  const row = [
    data.date,
    data.learnerName || '',
    data.attendanceStatus || 'Present',
    data.authorised ? 'Yes' : 'No',
    data.reason || '',
    data.capturedBy || '',
    data.supervisor || '',
    data.manager || '',
    data.comments || '',
  ];
  sheet.appendRow(row);

  logAudit_({ user: data.capturedBy || 'System', action: 'Captured attendance', oldValue: '', newValue: JSON.stringify(row) });
  return { success: true, message: 'Attendance captured' };
}

function recalculateBalances_(learnerName) {
  const learnersSheet = getOrCreateSheet_('Learners', CONFIG.HEADERS.LEARNERS);
  const leavesSheet = getOrCreateSheet_('LeaveRequests', CONFIG.HEADERS.LEAVE_REQUESTS);
  const balancesSheet = getOrCreateSheet_('LeaveBalances', CONFIG.HEADERS.LEAVE_BALANCES);

  let startDate = '';
  let endDate = '';
  const learnerData = learnersSheet.getDataRange().getValues();
  for (let i = 1; i < learnerData.length; i++) {
    if (String(learnerData[i][0]).toLowerCase() === learnerName.toLowerCase()) {
      startDate = String(learnerData[i][6]);
      endDate = String(learnerData[i][7]);
      break;
    }
  }

  if (!startDate) return;

  var now = new Date();
  var endDateLimit = endDate ? new Date(endDate) : now;
  if (endDateLimit > now) endDateLimit = now;
  var start = new Date(startDate);
  var months = (endDateLimit.getFullYear() - start.getFullYear()) * 12 + endDateLimit.getMonth() - start.getMonth();
  var accrued = Math.min(months * 1.5, 18);

  let annualTaken = 0;
  let sickUsed = 0;
  let familyUsed = 0;
  const leaveData = leavesSheet.getDataRange().getValues();
  for (let i = 1; i < leaveData.length; i++) {
    if (String(leaveData[i][1]).toLowerCase() === learnerName.toLowerCase() && String(leaveData[i][11]) === 'Approved') {
      const days = parseFloat(String(leaveData[i][5])) || 0;
      const type = String(leaveData[i][2]);
      if (type === 'Annual') annualTaken += days;
      else if (type === 'Sick') sickUsed += days;
      else if (type === 'Family Responsibility') familyUsed += days;
    }
  }

  const balance = Math.round((accrued - annualTaken) * 10) / 10;
  const now = new Date().toISOString();

  const balanceData = balancesSheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < balanceData.length; i++) {
    if (String(balanceData[i][0]).toLowerCase() === learnerName.toLowerCase()) {
      balancesSheet.getRange(i + 1, 2).setValue(accrued);
      balancesSheet.getRange(i + 1, 3).setValue(annualTaken);
      balancesSheet.getRange(i + 1, 4).setValue(balance);
      balancesSheet.getRange(i + 1, 5).setValue(sickUsed);
      balancesSheet.getRange(i + 1, 6).setValue(familyUsed);
      balancesSheet.getRange(i + 1, 7).setValue(now);
      found = true;
      break;
    }
  }
  if (!found) {
    balancesSheet.appendRow([learnerName, accrued, annualTaken, balance, sickUsed, familyUsed, now]);
  }
}

function recalculateAllBalances_() {
  const learnersSheet = getOrCreateSheet_('Learners', CONFIG.HEADERS.LEARNERS);
  const data = learnersSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][0]);
    if (name) recalculateBalances_(name);
  }

  return { success: true, message: 'All balances recalculated' };
}

function addUser_(data) {
  const sheet = getOrCreateSheet_('Users', CONFIG.HEADERS.USERS);
  const id = generateId_('USR');
  const row = [id, data.email, data.name, data.role, data.password, data.department || ''];
  sheet.appendRow(row);
  return { success: true, userId: id };
}

function logAudit_(data) {
  try {
    const sheet = getOrCreateSheet_('AuditLog', CONFIG.HEADERS.AUDIT_LOG);
    const id = generateId_('AUD');
    const now = new Date();
    const row = [
      id,
      data.user || 'System',
      Utilities.formatDate(now, 'Africa/Johannesburg', 'yyyy-MM-dd'),
      Utilities.formatDate(now, 'Africa/Johannesburg', 'HH:mm:ss'),
      data.action || '',
      data.oldValue || '',
      data.newValue || '',
      data.ip || '',
    ];
    sheet.appendRow(row);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

function getDashboardStats_() {
  initializeSheets_();

  const learnersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Learners');
  const leavesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LeaveRequests');
  const absenteeismSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Absenteeism');

  const learners = learnersSheet ? learnersSheet.getDataRange().getValues() : [];
  const leaves = leavesSheet ? leavesSheet.getDataRange().getValues() : [];
  const absences = absenteeismSheet ? absenteeismSheet.getDataRange().getValues() : [];

  const totalLearners = Math.max(0, learners.length - 1);
  const activeLearners = learners.filter(function(r, i) { return i > 0 && String(r[8]) === 'Active'; }).length;
  const pendingRequests = leaves.filter(function(r, i) { return i > 0 && String(r[11]) === 'Pending'; }).length;

  const today = Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyy-MM-dd');
  const approvedToday = leaves.filter(function(r, i) { return i > 0 && String(r[11]) === 'Approved' && String(r[3]).startsWith(today); }).length;
  const annualLeaveDays = leaves
    .filter(function(r, i) { return i > 0 && String(r[2]) === 'Annual' && String(r[11]) === 'Approved'; })
    .reduce(function(sum, r) { return sum + (parseFloat(String(r[5])) || 0); }, 0);

  const totalAbsences = Math.max(0, absences.length - 1);
  const unauthorised = absences.filter(function(r, i) { return i > 0 && String(r[3]).toLowerCase() !== 'yes' && String(r[2]) !== 'Present'; }).length;
  const lateArrivals = absences.filter(function(r, i) { return i > 0 && String(r[2]) === 'Late'; }).length;

  return {
    totalLearners: totalLearners,
    activeLearners: activeLearners,
    pendingLeaveRequests: pendingRequests,
    approvedLeaveToday: approvedToday,
    annualLeaveDaysUsed: annualLeaveDays,
    absenteeismRate: totalAbsences > 0 ? Math.round((unauthorised / totalAbsences) * 100) : 0,
    unauthorisedAbsences: unauthorised,
    lateArrivals: lateArrivals,
  };
}

function getChartData_() {
  initializeSheets_();
  const leavesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LeaveRequests');
  if (!leavesSheet) return { months: [] };

  const data = leavesSheet.getDataRange().getValues();
  const months = {};

  data.forEach(function(row, i) {
    if (i === 0 || String(row[11]) !== 'Approved') return;
    const date = new Date(String(row[3]));
    const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    const label = Utilities.formatDate(date, 'Africa/Johannesburg', 'MMM yyyy');
    const days = parseFloat(String(row[5])) || 0;
    const type = String(row[2]);

    if (!months[key]) months[key] = { month: label, annual: 0, sick: 0, familyResponsibility: 0, unpaid: 0, total: 0 };
    if (type === 'Annual') months[key].annual += days;
    else if (type === 'Sick') months[key].sick += days;
    else if (type === 'Family Responsibility') months[key].familyResponsibility += days;
    else if (type === 'Unpaid') months[key].unpaid += days;
    months[key].total += days;
  });

  return {
    months: Object.keys(months).sort().map(function(k) { return months[k]; }),
  };
}

function generateId_(prefix) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return prefix + '-' + timestamp + '-' + random;
}

function onOpen() {
  initializeSheets_();
  SpreadsheetApp.getUi()
    .createMenu('LeaveHub')
    .addItem('Recalculate All Balances', 'recalculateAllBalances_')
    .addItem('Initialize Sheets', 'initializeSheets_')
    .addSeparator()
    .addItem('About', 'showAbout_')
    .addToUi();
}

function showAbout_() {
  SpreadsheetApp.getUi().alert(
    'LeaveHub Leave Management System\n\n' +
    'Version 2.0\n' +
    'Enterprise-grade leave management powered by Google Sheets.\n\n' +
    'Use the LeaveHub web app to manage learners, leave requests, and attendance.'
  );
}

function dailyRecalculationTrigger() {
  recalculateAllBalances_();
  logAudit_({ user: 'System (Auto)', action: 'Daily balance recalculation', oldValue: '', newValue: '' });
}
