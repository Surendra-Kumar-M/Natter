import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, User, Mail, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="btn btn-ghost btn-sm btn-circle" aria-label="Back to chats">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
          
          {/* Top Section: Avatar & Basic Info */}
          <div className="p-8 flex flex-col items-center border-b border-base-300 bg-base-200/30">
            <div className="relative mb-4 group">
              <div className="size-32 rounded-full overflow-hidden border-4 border-base-100 shadow-md">
                <img
                  src={selectedImg || authUser.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-1 right-1 
                  bg-primary text-primary-content hover:scale-105
                  p-2.5 rounded-full cursor-pointer shadow-lg
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none opacity-50" : ""}
                `}
                aria-label="Upload profile picture"
              >
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            
            <h2 className="text-2xl font-bold mb-1">{authUser?.fullName}</h2>
            <p className="text-sm font-medium text-success">Online</p>
          </div>

          {/* Account Details Section */}
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">Account</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-base-200 rounded-lg text-base-content/70 mt-0.5">
                  <User className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-base-content/60 mb-0.5">Full Name</p>
                  <p className="font-medium text-base truncate">{authUser?.fullName}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-base-200 rounded-lg text-base-content/70 mt-0.5">
                  <Mail className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-base-content/60 mb-0.5">Email</p>
                  <p className="font-medium text-base truncate">{authUser?.email}</p>
                  {/* Notice for Google Users if applicable, although we don't have a direct flag, this is a clean representation */}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-base-200 rounded-lg text-base-content/70 mt-0.5">
                  <Calendar className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-base-content/60 mb-0.5">Member Since</p>
                  <p className="font-medium text-base truncate">{new Date(authUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
