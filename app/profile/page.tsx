import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth")
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-8">
      <div className="px-6 py-8">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-4xl shadow-inner">
            {session.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">My Profile</h2>
        
        <div className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Login ID</label>
            <div className="text-base text-gray-900 font-medium p-3 bg-gray-50 rounded-md border border-gray-100">
              {session.user?.name || 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <div className="text-base text-gray-900 font-medium p-3 bg-gray-50 rounded-md border border-gray-100">
              {session.user?.email || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
