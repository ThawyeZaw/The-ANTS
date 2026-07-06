'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  FileText,
  Plus,
  Megaphone,
  Clock,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import ClassroomCard from '@/components/classrooms/ClassroomCard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  getTeacherDashboardStats,
  getClassroomsByUser,
  getProfile,
  mockClassroomMembers,
  mockClassroomCurriculums,
  mockCurriculums,
  mockAssignments,
  mockExams,
  mockClubAnnouncements,
} from '@/lib/mock/database';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { role, isTeacher } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role && !isTeacher) {
      router.replace(`/${role === 'main_contributor' ? 'main-contributor' : role}`);
    }
  }, [role, isTeacher, router]);

  if (!user || !isTeacher) return null;

  const firstName = user.profile.name.split(' ')[0];
  const welcomeSubtitle = "Your classrooms are waiting. Here's your teaching overview for today.";
  const stats = getTeacherDashboardStats(user.id);

  // Fetch Teacher Classrooms
  const teacherClassrooms = getClassroomsByUser(user.id);
  const teacherClassIds = teacherClassrooms.map(c => c.id);

  // Filter assignments for this teacher's classrooms
  const activeAssignments = mockAssignments.filter(a => teacherClassIds.includes(a.classroom_id));

  const mainContent = (
    <div className="space-y-6">
      {/* Active Classrooms */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-500" />
            Active Classrooms
          </h2>
          <Link href="/classrooms" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Manage Classrooms
          </Link>
        </div>

        {teacherClassrooms.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center">
            <GraduationCap className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No classrooms assigned</p>
            <p className="text-xs text-foreground-muted mt-1">Create or join a classroom to get started teaching.</p>
            <Link href="/classrooms" className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Go to Classrooms
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teacherClassrooms.map((classroom) => {
              const memberCount = mockClassroomMembers.filter(m => m.classroom_id === classroom.id).length;
              const teachers = mockClassroomMembers.filter(m => m.classroom_id === classroom.id && m.role === 'teacher');
              const teacherNames = teachers.map(t => getProfile(t.user_id)?.name).filter(Boolean) as string[];
              const currIds = mockClassroomCurriculums.filter(cc => cc.classroom_id === classroom.id).map(cc => cc.curriculum_id);
              const curriculumNames = mockCurriculums.filter(c => currIds.includes(c.id)).map(c => c.title);

              return (
                <ClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                  memberCount={memberCount}
                  teacherNames={teacherNames}
                  curriculumNames={curriculumNames}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Active Assignments */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Active Assignments
          </h2>
        </div>

        {activeAssignments.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center text-foreground-muted">
            <p className="text-sm font-medium">No active assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAssignments.slice(0, 3).map((assignment) => {
              const classroomName = teacherClassrooms.find(c => c.id === assignment.classroom_id)?.name || 'Classroom';
              return (
                <div key={assignment.id} className="p-4 bg-background-card/50 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-primary/45 transition-colors">
                  <div>
                    <span className="text-xs text-foreground-muted block mb-0.5">{classroomName}</span>
                    <h4 className="font-semibold text-sm text-foreground">{assignment.title}</h4>
                    <p className="text-xs text-foreground-muted mt-1">Due: {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      assignment.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                      assignment.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)} Priority
                    </span>
                    <Link href={`/classrooms/${assignment.classroom_id}`} className="text-xs text-primary font-semibold hover:underline">
                      Grade Submission →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="space-y-6">
      {/* Club Announcements */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-foreground text-lg">
            <Megaphone className="h-5 w-5 text-sky-500" />
            Club Announcements
          </h3>
        </div>
        <div className="space-y-3">
          {mockClubAnnouncements.slice(0, 3).map(ann => (
            <div key={ann.id} className="p-3 bg-background-secondary/50 rounded-xl border border-border/50">
              <p className="font-semibold text-sm text-foreground">{ann.title}</p>
              <p className="text-xs text-foreground-muted mt-1">{ann.content}</p>
            </div>
          ))}
          {mockClubAnnouncements.length === 0 && (
            <p className="text-sm text-foreground-muted">No announcements right now.</p>
          )}
        </div>
      </div>

      {/* Upcoming Exams */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-foreground text-lg">
            <Clock className="h-5 w-5 text-rose-500" />
            Upcoming Exams
          </h3>
        </div>
        <div className="space-y-3">
          {mockExams.slice(0, 3).map(exam => (
            <div key={exam.id} className="p-3 bg-background-secondary/50 rounded-xl border border-border/50 flex flex-col justify-between">
              <div>
                <p className="font-semibold text-sm text-foreground">{exam.title}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{exam.exam_series}</p>
              </div>
              <div className="mt-2 text-xs font-semibold text-rose-500 bg-rose-500/10 self-start px-2 py-1 rounded-md">
                {new Date(exam.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
          {mockExams.length === 0 && (
            <p className="text-sm text-foreground-muted">No upcoming exams.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      firstName={firstName}
      welcomeSubtitle={welcomeSubtitle}
      stats={stats}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
    />
  );
}
