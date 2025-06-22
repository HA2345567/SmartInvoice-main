import { DatabaseService } from '@/lib/database';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function FeedbackAdminPage() {
  // Replace with your real admin check
  const session = await getServerSession();
  const user = session?.user;
  const isAdmin = user && user.email && user.email.endsWith('@smartinvoice.com'); // adjust as needed
  if (!isAdmin) {
    redirect('/dashboard');
  }
  const feedback = await DatabaseService.getAllFeedback();
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">User Feedback</h1>
      <div className="space-y-6">
        {feedback.length === 0 && <p className="text-gray-500">No feedback yet.</p>}
        {feedback.map((fb: any) => (
          <div key={fb.id} className="p-4 rounded-lg border border-green-500/30 bg-green-900/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm px-2 py-1 rounded bg-green-500/20 text-green-700 font-semibold">{fb.type}</span>
              <span className="text-yellow-500 font-bold">{'★'.repeat(fb.rating)}</span>
              <span className="text-xs text-gray-400 ml-auto">{new Date(fb.createdAt).toLocaleString()}</span>
            </div>
            <div className="font-bold text-lg mb-1">{fb.title}</div>
            <div className="text-gray-200 mb-2">{fb.description}</div>
            {fb.category && <div className="text-xs text-green-400 mb-1">Category: {fb.category}</div>}
            {fb.email && <div className="text-xs text-blue-400">Email: {fb.email}</div>}
          </div>
        ))}
      </div>
    </div>
  );
} 