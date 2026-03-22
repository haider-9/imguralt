// Temporary in-memory fallback for when MongoDB is unavailable
interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  isPublic: boolean;
  uploadedAt: Date;
  userId: string;
}

interface User {
  _id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
}

// In-memory storage (will reset on server restart)
let videos: Video[] = [];
let users: User[] = [];

// Sample data for development
const sampleVideos: Video[] = [
  {
    _id: '1',
    title: 'Sample Video 1',
    description: 'This is a sample video for development',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnailUrl: 'https://via.placeholder.com/320x180/4f46e5/ffffff?text=Sample+Video+1',
    isPublic: true,
    uploadedAt: new Date('2024-01-15'),
    userId: 'sample-user-1'
  },
  {
    _id: '2',
    title: 'Sample Video 2',
    description: 'Another sample video for testing',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    thumbnailUrl: 'https://via.placeholder.com/320x180/059669/ffffff?text=Sample+Video+2',
    isPublic: true,
    uploadedAt: new Date('2024-01-14'),
    userId: 'sample-user-1'
  },
  {
    _id: '3',
    title: 'Sample Video 3',
    description: 'Third sample video for the gallery',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
    thumbnailUrl: 'https://via.placeholder.com/320x180/dc2626/ffffff?text=Sample+Video+3',
    isPublic: true,
    uploadedAt: new Date('2024-01-13'),
    userId: 'sample-user-2'
  }
];

// Initialize with sample data
videos = [...sampleVideos];

export const fallbackDB = {
  // Video operations
  videos: {
    find: (filter: { isPublic?: boolean } = {}) => {
      let result = videos;
      if (filter.isPublic !== undefined) {
        result = videos.filter(v => v.isPublic === filter.isPublic);
      }
      return {
        sort: (sortObj: { uploadedAt?: number }) => ({
          limit: (limit: number) => ({
            skip: (skip: number) => ({
              lean: () => result
                .sort((a, b) => sortObj.uploadedAt === -1 ? 
                  new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime() :
                  new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
                )
                .slice(skip, skip + limit)
            })
          })
        })
      };
    },
    
    findById: (id: string) => videos.find(v => v._id === id),
    
    create: (videoData: Omit<Video, '_id'>) => {
      const newVideo: Video = {
        ...videoData,
        _id: Date.now().toString()
      };
      videos.push(newVideo);
      return newVideo;
    },
    
    updateById: (id: string, update: Partial<Video>) => {
      const index = videos.findIndex(v => v._id === id);
      if (index !== -1) {
        videos[index] = { ...videos[index], ...update };
        return videos[index];
      }
      return null;
    },
    
    deleteById: (id: string) => {
      const index = videos.findIndex(v => v._id === id);
      if (index !== -1) {
        return videos.splice(index, 1)[0];
      }
      return null;
    }
  },
  
  // User operations
  users: {
    findOne: (filter: { email?: string }) => {
      if (filter.email) {
        return users.find(u => u.email === filter.email);
      }
      return users[0] || null;
    },
    
    create: (userData: Omit<User, '_id'>) => {
      const newUser: User = {
        ...userData,
        _id: Date.now().toString()
      };
      users.push(newUser);
      return newUser;
    }
  }
};