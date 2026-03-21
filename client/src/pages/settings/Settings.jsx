import { useState }              from "react";
import { useDispatch }           from "react-redux";
import AppLayout                 from "../../components/layout/AppLayout";
import { updateProfile as updateProfileLocal } from
  "../../store/slices/authSlice";
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "../../store/api/authApi";
import { getInitials }           from "../../utils/formatters";
import useAuth                   from "../../hooks/useAuth";
import toast                     from "react-hot-toast";

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [updateProfile,  { isLoading: isUpdating  }] =
    useUpdateProfileMutation();
  const [changePassword, { isLoading: isChanging  }] =
    useChangePasswordMutation();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "", newPassword: "", confirmPassword: "",
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const result = await updateProfile(profileForm).unwrap();
      dispatch(updateProfileLocal(result.data));
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      toast.success("Password changed successfully");
      setPasswordForm({
        oldPassword: "", newPassword: "", confirmPassword: "",
      });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to change password");
    }
  };

  return (
    <AppLayout title="Settings">

      <div className="max-w-2xl">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your account preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-6 mb-4">
          <h3 className="font-semibold text-gray-800 mb-4">
            Profile Information
          </h3>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex
              items-center justify-center text-white text-xl font-bold">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name}
                    className="w-full h-full rounded-full object-cover" />
                : getInitials(user?.name)
              }
            </div>
            <div>
              <p className="font-medium text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="text-xs bg-blue-100 text-blue-700
                px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                {user?.role?.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Full Name</label>
              <input
                type="text" required
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({
                  ...p, name: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Email</label>
              <input
                type="email" disabled value={user?.email}
                className="w-full px-3 py-2 border border-gray-100
                  rounded-lg text-sm bg-gray-50 text-gray-400
                  cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            <button
              type="submit" disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                text-white px-4 py-2 rounded-lg text-sm font-medium
                transition-colors"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Change Password
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">

            {[
              { label: "Current Password",  name: "oldPassword" },
              { label: "New Password",      name: "newPassword" },
              { label: "Confirm Password",  name: "confirmPassword" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1">{field.label}</label>
                <input
                  type="password" required
                  value={passwordForm[field.name]}
                  onChange={(e) => setPasswordForm((p) => ({
                    ...p, [field.name]: e.target.value
                  }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-200
                    rounded-lg text-sm focus:outline-none
                    focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <button
              type="submit" disabled={isChanging}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                text-white px-4 py-2 rounded-lg text-sm font-medium
                transition-colors"
            >
              {isChanging ? "Changing..." : "Change Password"}
            </button>

          </form>
        </div>

      </div>
    </AppLayout>
  );
};

export default Settings;