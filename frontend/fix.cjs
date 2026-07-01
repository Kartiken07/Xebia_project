const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');

const startMarker = '</header>';
const endMarker = '</main>';

const startIndex = content.indexOf(startMarker) + startMarker.length;
const endIndex = content.lastIndexOf(endMarker);

const replacement = `
        <Routes>
          <Route path="/" element={
            <DashboardOverview 
              employees={employees} projects={projects} leaves={leaves}
              assets={assets} tasks={tasks} gpsSimulated={gpsSimulated}
              setGpsSimulated={setGpsSimulated} qrSimulated={qrSimulated}
              setQrSimulated={setQrSimulated} handleClockIn={handleClockIn}
              handleClockOut={handleClockOut}
            />
          } />
          
          <Route path="/employees" element={
            <EmployeesPage 
              userRole={userRole} employees={employees} departments={departments}
              showAddEmp={showAddEmp} setShowAddEmp={setShowAddEmp}
              newEmpData={newEmpData} setNewEmpData={setNewEmpData}
              handleCreateEmp={handleCreateEmp}
            />
          } />

          <Route path="/recruitment" element={
            <RecruitmentPage 
              candidates={candidates} showAddCand={showAddCand}
              setShowAddCand={setShowAddCand} newCandData={newCandData}
              setNewCandData={setNewCandData} handleCreateCand={handleCreateCand}
              handleResumeAnalysis={handleResumeAnalysis}
            />
          } />

          <Route path="/attendance" element={<AttendancePage attendance={attendance} />} />
          
          <Route path="/leaves" element={<LeavePage leaves={leaves} handleApplyLeave={handleApplyLeave} />} />
          
          <Route path="/payroll" element={<PayrollPage payroll={payroll} />} />
          
          <Route path="/projects" element={
            <ProjectsPage 
              projects={projects} showAddProj={showAddProj} setShowAddProj={setShowAddProj}
              newProjData={newProjData} setNewProjData={setNewProjData} handleCreateProj={handleCreateProj}
              tasks={tasks} showAddTask={showAddTask} setShowAddTask={setShowAddTask}
              newTaskData={newTaskData} setNewTaskData={setNewTaskData} handleCreateTask={handleCreateTask}
              employees={employees}
            />
          } />
          
          <Route path="/assets" element={
            <AssetsPage 
              userRole={userRole} assets={assets} showAddAsset={showAddAsset}
              setShowAddAsset={setShowAddAsset} newAssetData={newAssetData}
              setNewAssetData={setNewAssetData} handleCreateAsset={handleCreateAsset}
              employees={employees}
            />
          } />
          
          <Route path="/tickets" element={
            <TicketsPage 
              tickets={tickets} showAddTicket={showAddTicket} setShowAddTicket={setShowAddTicket}
              newTicketData={newTicketData} setNewTicketData={setNewTicketData} handleCreateTicket={handleCreateTicket}
            />
          } />
          
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      `;

const newContent = content.substring(0, startIndex) + '\n' + replacement + '\n      ' + content.substring(endIndex);
fs.writeFileSync('src/App.jsx', newContent);
