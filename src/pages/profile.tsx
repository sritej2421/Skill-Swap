import React, { useState, useMemo, useEffect, useRef } from "react";
import { User, Image, MapPin, GraduationCap, Languages, BookOpen, Users, Info, Link as LinkIcon, Plus, Camera, Info as InfoIcon, Award, Badge } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "react-day-picker";

const skillOptions = [
  "JavaScript", "Python", "UI/UX Design", "Public Speaking", "Data Science", "Marketing", "Writing", "Photography", "Music", "Other"
];

interface ProfileForm {
  fullName: string;
  profilePic: File | null;
  location: string;
  role: string;
  skillsTeach: string[];
  skillsLearn: string[];
  bio: string;
  language: string;
  portfolio: string;
  avatarUrl: string | null;
  verified_skills?: Record<string, any>;
  completed_tests?: Record<string, any>;
}

interface ProfileErrors {
  fullName?: string;
  location?: string;
  role?: string;
  skillsTeach?: string;
  skillsLearn?: string;
  bio?: string;
  language?: string;
}

const PROFILE_PLACEHOLDER = "https://ui-avatars.com/api/?name=Profile&background=6d28d9&color=fff&rounded=true&size=128";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    profilePic: null,
    location: "",
    role: "",
    skillsTeach: [],
    skillsLearn: [],
    bio: "",
    language: "",
    portfolio: "",
    avatarUrl: null,
    verified_skills: {},
    completed_tests: {},
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [customTeach, setCustomTeach] = useState("");
  const [customLearn, setCustomLearn] = useState("");
  const [touched, setTouched] = useState<{[k: string]: boolean}>({});
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  // Calculate completion and missing fields
  const completionInfo = useMemo(() => {
    let percent = 0;
    const missing: string[] = [];
    if (form.fullName) percent += 12.5; else missing.push("Full Name");
    if (form.avatarUrl || form.profilePic) percent += 12.5; else missing.push("Profile Picture");
    if (form.location) percent += 12.5; else missing.push("Location");
    if (form.role) percent += 12.5; else missing.push("Student/Professional");
    if (form.skillsTeach.length > 0) percent += 15; else missing.push("Skills You Can Teach");
    if (form.skillsLearn.length > 0) percent += 15; else missing.push("Skills You Want to Learn");
    if (form.bio) percent += 10; else missing.push("Bio/About Me");
    if (form.language) percent += 10; else missing.push("Preferred Language");
    return { percent: Math.round(percent), missing };
  }, [form.fullName, form.profilePic, form.location, form.role, form.skillsTeach, form.skillsLearn, form.bio, form.language, form.avatarUrl]);

  // Load profile data on mount
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, verified_skills, completed_tests')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means row not found, which is fine for a new user
          throw error;
        }

        if (data) {
          console.log('Loaded profile data:', data);
          setForm({
            fullName: data.full_name || "",
            profilePic: null,
            location: data.location || "",
            role: data.role || "",
            skillsTeach: data.skills_teach || [],
            skillsLearn: data.skills_learn || [],
            bio: data.bio || "",
            language: data.language || "",
            portfolio: data.portfolio || "",
            avatarUrl: data.avatar_url || null,
            verified_skills: data.verified_skills || {},
            completed_tests: data.completed_tests || {}
          });

          if (data.avatar_url) {
            setProfilePicPreview(data.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "file" && e.target instanceof HTMLInputElement) {
      const files = e.target.files;
      if (files && files[0]) {
        setForm(f => ({ ...f, profilePic: files[0] }));
        setProfilePicPreview(URL.createObjectURL(files[0]));
      }
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setTouched(t => ({ ...t, [e.target.name]: true }));
    validate();
  }

  function handleMultiSelect(name: keyof Pick<ProfileForm, 'skillsTeach' | 'skillsLearn'>, value: string) {
    setForm(f => {
      const arr = f[name];
      return {
        ...f,
        [name]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value],
      };
    });
  }

  function handleAddCustomSkill(name: keyof Pick<ProfileForm, 'skillsTeach' | 'skillsLearn'>, value: string) {
    if (!value.trim()) return;
    setForm(f => {
      const arr = f[name];
      if (arr.includes(value.trim())) return f;
      return {
        ...f,
        [name]: [...arr, value.trim()],
      };
    });
    if (name === "skillsTeach") setCustomTeach("");
    if (name === "skillsLearn") setCustomLearn("");
  }

  function handleCustomSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>, name: keyof Pick<ProfileForm, 'skillsTeach' | 'skillsLearn'>, value: string) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomSkill(name, value);
    }
  }

  function validate() {
    const newErrors: ProfileErrors = {};
    if (!form.fullName) newErrors.fullName = "Full name is required.";
    if (!form.location) newErrors.location = "Location is required.";
    if (!form.role) newErrors.role = "Please select Student or Professional.";
    if (form.skillsTeach.length === 0) newErrors.skillsTeach = "Add at least one skill to teach.";
    if (form.skillsLearn.length === 0) newErrors.skillsLearn = "Add at least one skill to learn.";
    if (!form.bio) newErrors.bio = "Bio is required.";
    if (!form.language) newErrors.language = "Preferred language is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      console.error("User not authenticated.");
      alert("You must be logged in to save your profile.");
      return;
    }

    console.log("Attempting to save profile for user ID:", user.id);

    if (validate()) {
      try {
        let currentAvatarUrl = form.avatarUrl; // Start with the URL loaded from the DB

        // Upload new profile picture if a file is selected in the input
        if (form.profilePic) {
          console.log("Uploading new profile picture...");
          const fileExt = form.profilePic.name.split('.').pop();
          const fileName = `${user.id}-${Math.random()}.${fileExt}`;
          const filePath = `avatars/${fileName}`; // Use 'avatars' bucket based on common practice, or 'profile-pictures' if that's what you named your bucket

          // If there was a previous avatar, you might want to delete it here first
          // if (form.avatarUrl) {
          //   const previousFileName = form.avatarUrl.split('/').pop();
          //   await supabase.storage.from('profile-pictures').remove([`avatars/${previousFileName}`]); // Adjust bucket name if needed
          // }

          const { error: uploadError } = await supabase.storage
            .from('profile-pictures') // Use the actual bucket name
            .upload(filePath, form.profilePic, { cacheControl: '3600', upsert: true });

          if (uploadError) throw uploadError;

          // Get the public URL for the newly uploaded file
          const { data: { publicUrl } } = supabase.storage
            .from('profile-pictures') // Use the actual bucket name
            .getPublicUrl(filePath);

          currentAvatarUrl = publicUrl;
          console.log("Profile picture uploaded:", currentAvatarUrl);

        } else if (form.avatarUrl && profilePicPreview && !form.profilePic) {
          // If there was an existing avatarUrl and no new file is selected,
          // but there is a preview (meaning user didn't explicitly clear it),
          // keep the existing URL.
           currentAvatarUrl = form.avatarUrl;
        } else if (!profilePicPreview && form.avatarUrl) {
             // This case handles if the user had a picture, the form loaded it into avatarUrl, but then they hit save without re-uploading. This should keep the avatarUrl.
             currentAvatarUrl = form.avatarUrl;
        } else {
           // If no new file, no existing avatarUrl, or preview was explicitly cleared (not implemented yet), set to null.
            currentAvatarUrl = null;
        }

        // Data to save to the profiles table
        const profileData = {
            id: user.id,
            full_name: form.fullName,
            avatar_url: currentAvatarUrl, // Use avatar_url to match DB column
            location: form.location,
            role: form.role,
            skills_teach: form.skillsTeach,
            skills_learn: form.skillsLearn,
            bio: form.bio,
            language: form.language,
            portfolio: form.portfolio,
            verified_skills: form.verified_skills,
            updated_at: new Date().toISOString(),
        };

        // Check if profile exists to decide between insert and update
        const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        let saveError = null;

        if (existingProfile) {
            // Update existing profile
            console.log("Profile exists, attempting update...");
            const { error } = await supabase
                .from('profiles')
                .update(profileData)
                .eq('id', user.id);
            saveError = error;
        } else {
            // Insert new profile
            console.log("Profile does not exist, attempting insert...");
            const { error } = await supabase
                .from('profiles')
                .insert([profileData]);
            saveError = error;
        }

        if (saveError) throw saveError;

        // Update local storage for profile completion (assuming save was successful)
        // Recalculate completion based on the form state after a successful save
        const latestCompletionInfo = (() => {
            let percent = 0;
            const missing: string[] = [];
            if (form.fullName) percent += 12.5;
            if (currentAvatarUrl) percent += 12.5; // Check against the saved URL
            if (form.location) percent += 12.5;
            if (form.role) percent += 12.5;
            if (form.skillsTeach.length > 0) percent += 15;
            if (form.skillsLearn.length > 0) percent += 15;
            if (form.bio) percent += 10;
            if (form.language) percent += 10;
            return { percent: Math.round(percent), missing }; // Simplified for localStorage
        })();

        localStorage.setItem("profileCompletion", latestCompletionInfo.percent.toString());
        localStorage.setItem("profileRequiredFields", JSON.stringify({
          role: !!form.role,
          skillsTeach: form.skillsTeach.length > 0,
          skillsLearn: form.skillsLearn.length > 0,
        }));

        alert("Profile saved successfully!");

        // Trigger congrats modal if profile is now 100% complete
        if (latestCompletionInfo.percent === 100) {
          setShowCongratsModal(true);
        }

      } catch (error: any) {
        console.error('Error saving profile:', error);
        alert("Error saving profile: " + error.message);
      }
    } else {
      setTouched({
        fullName: true,
        location: true,
        role: true,
        skillsTeach: true,
        skillsLearn: true,
        bio: true,
        language: true,
        // Add other fields if they become required
      });
       console.log("Validation failed.", errors);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#28243c] via-[#322c54] to-[#3b2f5e]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#28243c] via-[#322c54] to-[#3b2f5e] p-4 relative">
      {/* Enhanced Back to Home Button with animations and effects */}
      <button
        onClick={() => navigate('/')}
        className="group absolute top-4 left-4 flex items-center gap-3 px-5 py-2.5 rounded-xl
          bg-white/5 backdrop-blur-md border border-white/10
          hover:bg-white/10 hover:border-white/20 hover:scale-105
          active:scale-95
          transition-all duration-300 ease-out
          shadow-[0_0_20px_rgba(109,40,217,0.2)] hover:shadow-[0_0_25px_rgba(109,40,217,0.3)]
          z-50"
      >
        <span className="relative flex items-center justify-center w-6 h-6">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary/20 group-hover:bg-primary/30 transition-all duration-300"></span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary relative transform -translate-x-0.5 group-hover:-translate-x-1 transition-transform duration-300"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" className="group-hover:opacity-70 transition-opacity duration-300" />
          </svg>
        </span>
        <span className="font-medium bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent
          text-sm sm:text-base whitespace-nowrap">
          Back to Home
        </span>
        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-purple-500/20 opacity-0 
          group-hover:opacity-100 blur transition-opacity duration-300 -z-10"></span>
      </button>

      {/* Progress Bar - Adjusted position and z-index */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl flex justify-center pointer-events-none">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 h-full rounded-full bg-white/20 dark:bg-[#6d28d9]/20 backdrop-blur-md" />
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md"
            initial={{ width: 0 }}
            animate={{ width: `${completionInfo.percent}%` }}
            transition={{ duration: 0.6, type: "spring" }}
          />
          <div className="relative flex items-center justify-center h-full w-full px-6 py-2">
            <span className="text-white font-semibold text-base flex items-center gap-2">
              Profile Completion: {completionInfo.percent}% {completionInfo.percent >= 80 && "✅"}
              <div className="relative group pointer-events-auto">
                <InfoIcon className="h-4 w-4 text-white/80 cursor-pointer ml-1" />
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#232136] text-white text-xs rounded-xl shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-indigo-700">
                  {completionInfo.missing.length === 0 ? (
                    <span>All fields complete! 🎉</span>
                  ) : (
                    <>
                      <span className="font-semibold text-indigo-300">Missing fields:</span>
                      <ul className="list-disc ml-4 mt-1">
                        {completionInfo.missing.map(f => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Adjusted margin top */}
      <div className="w-full max-w-xl bg-[#232136]/80 backdrop-blur-md rounded-3xl shadow-2xl p-0 flex flex-col items-center border border-indigo-900 mt-32">
        {/* Profile Picture */}
        <div className="relative flex flex-col items-center -mt-12 mb-2">
          <label htmlFor="profilePic" className="cursor-pointer group">
            <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-indigo-600 shadow-lg bg-[#232136] flex items-center justify-center">
              <img
                src={profilePicPreview || PROFILE_PLACEHOLDER}
                alt="Profile Preview"
                className="object-cover w-full h-full group-hover:brightness-75 transition-all"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <Camera className="h-8 w-8 text-white/80" />
              </div>
            </div>
            <input
              id="profilePic"
              type="file"
              accept="image/*"
              name="profilePic"
              onChange={handleChange}
              className="hidden"
            />
          </label>
          <span className="text-xs text-indigo-300 mt-2">Click to upload a profile picture</span>
        </div>
        <form
          className="w-full flex flex-col gap-6 px-8 pb-8 pt-2"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
            Complete Your Profile to Start Swapping Skills
          </h1>
          <p className="text-lg text-indigo-300 text-center mb-4">
            Unlock powerful features like matches, verification badges, and sessions by completing your SkillSwap profile.
          </p>

          {/* Full Name */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-1">
              <User className="h-5 w-5 text-indigo-400" /> Full Name
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full rounded-xl bg-[#232136] border border-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white px-4 py-2 transition-all outline-none mb-1 shadow-sm"
              placeholder="Enter your full name"
            />
            {touched.fullName && errors.fullName && <div className="text-sm text-rose-400">{errors.fullName}</div>}
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-1">
              <MapPin className="h-5 w-5 text-indigo-400" /> Location (City, Country)
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full rounded-xl bg-[#232136] border border-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white px-4 py-2 transition-all outline-none mb-1 shadow-sm"
              placeholder="e.g. New York, USA"
            />
            {touched.location && errors.location && <div className="text-sm text-rose-400">{errors.location}</div>}
          </div>

          {/* Student/Professional Dropdown */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-1">
              <GraduationCap className="h-5 w-5 text-indigo-400" /> Are you a Student or Professional?
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full rounded-xl bg-[#232136] border border-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white px-4 py-2 transition-all outline-none mb-1 shadow-sm"
            >
              <option value="">Select...</option>
              <option value="student">Student</option>
              <option value="professional">Professional</option>
              <option value="both">Both</option>
            </select>
            {touched.role && errors.role && <div className="text-sm text-rose-400">{errors.role}</div>}
          </div>

          {/* Skills You Can Teach (multi-select + custom) */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-1">
              <BookOpen className="h-5 w-5 text-indigo-400" /> Skills You Can Teach
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skillOptions.map(skill => (
                <button
                  type="button"
                  key={skill}
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition-all
                    ${form.skillsTeach.includes(skill)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-[#232136] text-indigo-200 border-indigo-700 hover:bg-indigo-800"}
                  `}
                  onClick={() => handleMultiSelect("skillsTeach", skill)}
                >
                  {skill}
                </button>
              ))}
              {form.skillsTeach.filter(skill => !skillOptions.includes(skill)).map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full border border-indigo-600 bg-indigo-700 text-white text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex gap-2 mb-1">
              <input
                type="text"
                value={customTeach}
                onChange={e => setCustomTeach(e.target.value)}
                onKeyDown={e => handleCustomSkillKeyDown(e, "skillsTeach", customTeach)}
                placeholder="Add a skill you can teach..."
                className="flex-1 rounded-xl bg-[#232136] border border-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white px-3 py-1 transition-all outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={() => handleAddCustomSkill("skillsTeach", customTeach)}
                className="px-3 py-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-md"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            {touched.skillsTeach && errors.skillsTeach && <div className="text-sm text-rose-400">{errors.skillsTeach}</div>}
          </div>

          {/* Verified Skills Section */}
          {Object.keys(form.verified_skills || {}).length > 0 ? (
            <div className="mt-4 p-4 rounded-xl bg-indigo-900/20 border border-indigo-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-400" />
                Verified Skills
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(form.verified_skills || {}).map(([skill, data]: [string, any]) => {
                  const completedTest = form.completed_tests?.[skill];
                  return (
                    <div key={skill} className="flex items-center justify-between p-3 rounded-lg bg-indigo-800/20 border border-indigo-700">
                      <div>
                        <p className="font-medium text-white">{skill}</p>
                        <p className="text-sm text-indigo-300">
                          Score: {data.score}% • {new Date(data.completedOn).toLocaleDateString()}
                        </p>
                        {completedTest && (
                          <p className="text-xs text-indigo-400 mt-1">
                            Last completed: {new Date(completedTest.completedOn).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`${
                          data.level === 'Expert' ? 'bg-green-500/20 text-green-400' :
                          data.level === 'Advanced' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {data.level}
                        </Badge>
                        <button
                          type="button"
                          className="text-xs border border-gray-600 rounded px-2 py-1 hover:bg-gray-700 transition-colors"
                          onClick={() => navigate('/testing', {
                            state: {
                              title: skill,
                              description: `Retake test for ${skill}`,
                              level: data.level,
                              estimatedTime: "30 min",
                              questionCount: 20
                            }
                          })}
                        >
                          Retake Test
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-indigo-900/20 border border-indigo-700">
              <p className="text-indigo-300 text-center">No verified skills</p>
            </div>
          )}

          {/* Skills You Want to Learn (multi-select + custom) */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-1">
              <Users className="h-5 w-5 text-indigo-400" /> Skills You Want to Learn
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skillOptions.map(skill => (
                <button
                  type="button"
                  key={skill}
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition-all
                    ${form.skillsLearn.includes(skill)
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-[#232136] text-purple-200 border-purple-700 hover:bg-purple-800"}
                  `}
                  onClick={() => handleMultiSelect("skillsLearn", skill)}
                >
                  {skill}
                </button>
              ))}
              {form.skillsLearn.filter(skill => !skillOptions.includes(skill)).map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full border border-purple-600 bg-purple-700 text-white text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex gap-2 mb-1">
              <input
                type="text"
                value={customLearn}
                onChange={e => setCustomLearn(e.target.value)}
                onKeyDown={e => handleCustomSkillKeyDown(e, "skillsLearn", customLearn)}
                placeholder="Add a skill you want to learn..."
                className="flex-1 rounded-xl bg-[#232136] border border-purple-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white px-3 py-1 transition-all outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={() => handleAddCustomSkill("skillsLearn", customLearn)}
                className="px-3 py-1 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center gap-1 shadow-md"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            {touched.skillsLearn && errors.skillsLearn && <div className="text-sm text-rose-400">{errors.skillsLearn}</div>}
          </div>

          {/* Bio/About Me */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-1">
              <Info className="h-5 w-5 text-indigo-400" /> Bio / About Me
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
              className="w-full rounded-xl bg-[#232136] border border-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white px-4 py-2 transition-all outline-none mb-1 resize-none shadow-sm"
              placeholder="Tell us about yourself..."
            />
            {touched.bio && errors.bio && <div className="text-sm text-rose-400">{errors.bio}</div>}
          </div>

          {/* Preferred Language */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-1">
              <Languages className="h-5 w-5 text-indigo-400" /> Preferred Language for Communication
            </label>
            <input
              name="language"
              value={form.language}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full rounded-xl bg-[#232136] border border-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white px-4 py-2 transition-all outline-none mb-1 shadow-sm"
              placeholder="e.g. English"
            />
            {touched.language && errors.language && <div className="text-sm text-rose-400">{errors.language}</div>}
          </div>

          {/* LinkedIn/Portfolio (optional) */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-1">
              <LinkIcon className="h-5 w-5 text-indigo-400" /> LinkedIn or Portfolio (optional)
            </label>
            <input
              name="portfolio"
              value={form.portfolio}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full rounded-xl bg-[#232136] border border-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white px-4 py-2 transition-all outline-none mb-1 shadow-sm"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="flex justify-center mt-2">
            <button
              type="submit"
              className="w-full md:w-2/3 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-xl hover:from-indigo-600 hover:to-purple-700 transition-all focus:ring-2 focus:ring-indigo-400 focus:outline-none animate-bounce-on-hover"
              style={{ boxShadow: "0 4px 32px 0 rgba(80, 70, 180, 0.25)" }}
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
      {/* 100% Completion Modal */}
      {showCongratsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white/90 dark:bg-[#232136]/90 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-700 p-0 w-full max-w-md mx-4">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-indigo-600 text-2xl font-bold focus:outline-none"
              onClick={() => setShowCongratsModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            {/* Illustration or Icon */}
            <div className="flex justify-center -mt-16">
              <span className="inline-block bg-gradient-to-tr from-indigo-400 to-purple-400 rounded-full p-4 shadow-lg">
                <span className="text-6xl">🎉</span>
              </span>
            </div>
            <div className="flex flex-col items-center px-8 py-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                You're All Set!
              </h2>
              <p className="text-base text-gray-700 dark:text-indigo-200 mb-6 text-center">
                Now take a quick test to earn a verification badge for your top skill:
                <span className="font-semibold text-indigo-600 dark:text-indigo-300 ml-1">
                  {form.skillsTeach[0] || "your skill"}
                </span>
              </p>
              <button
                className="w-full py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-xl hover:from-indigo-600 hover:to-purple-700 transition-all focus:ring-2 focus:ring-indigo-400 focus:outline-none animate-bounce-on-hover"
                style={{ boxShadow: "0 4px 32px 0 rgba(80, 70, 180, 0.25)" }}
                onClick={() => { window.location.href = '/test'; }}
              >
                Take Test Now →
              </button>
            </div>
          </div>
          <style>{`
            .animate-fade-in {
              animation: fadeInModal 0.4s cubic-bezier(.4,0,.2,1);
            }
            @keyframes fadeInModal {
              0% { opacity: 0; transform: translateY(40px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .animate-bounce-on-hover:hover {
              animation: bounce 0.5s;
              box-shadow: 0 0 16px 4px #a78bfa, 0 4px 32px 0 rgba(80, 70, 180, 0.25);
            }
            @keyframes bounce {
              0% { transform: translateY(0); }
              30% { transform: translateY(-8px); }
              50% { transform: translateY(0); }
              70% { transform: translateY(-4px); }
              100% { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}