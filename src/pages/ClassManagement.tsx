import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { LightbulbIcon } from '@/components/icons/AcademicIcons';

const ClassManagement: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { classes, addStudentToClass } = useStore();

  const classData = classes.find(c => c.id === classId);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Class not found</p>
          <button
            onClick={() => navigate('/instructor')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleAddStudent = () => {
    if (!studentEmail) {
      alert('Please enter a student email');
      return;
    }

    // Mock student ID generation - in production, this would look up the student
    const studentId = `student-${Date.now()}`;
    addStudentToClass(classData.id, studentId);
    setShowAddStudent(false);
    setStudentEmail('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {classData.name}
              </h1>
              <p className="text-gray-600">{classData.description}</p>
            </div>
            <button
              onClick={() => navigate('/instructor')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Students Section */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Students</h2>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Student
                </button>
              </div>

              {classData.students.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No students enrolled yet. Add students to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {classData.students.map((studentId, index) => (
                    <div
                      key={studentId}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            Student {index + 1}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {studentId}
                          </div>
                        </div>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Class Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Class Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Students</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {classData.students.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Exams</span>
                  <span className="text-2xl font-bold text-green-600">
                    {classData.exams.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created</span>
                  <span className="text-sm text-gray-500">
                    {classData.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <LightbulbIcon className="text-blue-600" size={20} />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/instructor/exam/create')}
                  className="w-full text-left px-4 py-2 bg-white rounded hover:bg-blue-100 transition"
                >
                  Create Exam for this Class
                </button>
                <button className="w-full text-left px-4 py-2 bg-white rounded hover:bg-blue-100 transition">
                  View Class Analytics
                </button>
                <button className="w-full text-left px-4 py-2 bg-white rounded hover:bg-blue-100 transition">
                  Export Student List
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={() => setShowAddStudent(false)}>
          <div
            className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl transform transition"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Add Student</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Email
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="student@example.com"
                  autoFocus
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleAddStudent}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddStudent(false);
                    setStudentEmail('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
