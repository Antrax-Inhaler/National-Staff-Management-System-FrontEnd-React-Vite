// services/profileService.ts
export interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  photo_url?: string;
  affiliate_logo_url?: string;
  affiliate_name?: string;
  affiliate_id?: number;
}

class ProfileService {
  // Get current user's profile
  async getCurrentProfile(): Promise<ProfileData> {
    const response = await fetch('/profile/info', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch profile');
    }
    
    return {
      id: data.data.id,
      first_name: data.data.first_name,
      last_name: data.data.last_name,
      email: data.data.work_email,
      photo_url: data.data.photo_url,
      affiliate_logo_url: data.data.affiliate_logo_url,
      affiliate_name: data.data.affiliate_name,
      affiliate_id: data.data.affiliate_id,
    };
  }

  // Get member's profile by ID
  async getProfileById(memberId: number): Promise<ProfileData> {
    const response = await fetch(`/members/${memberId}/profile`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch member profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch member profile');
    }
    
    return {
      id: data.data.id,
      first_name: data.data.first_name,
      last_name: data.data.last_name,
      photo_url: data.data.photo_url,
      affiliate_logo_url: data.data.affiliate_logo_url,
      affiliate_name: data.data.affiliate_name,
      affiliate_id: data.data.affiliate_id,
    };
  }

  // Upload profile photo
  async uploadProfilePhoto(file: File): Promise<{ photo_url: string }> {
    const formData = new FormData();
    formData.append('profile_photo', file);
    
    const response = await fetch('/profile/upload-photo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload photo: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to upload photo');
    }
    
    return { photo_url: data.data.profile_photo_url };
  }
}

export const profileService = new ProfileService();