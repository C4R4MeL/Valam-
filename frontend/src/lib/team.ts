type TeamText = { id: string; en: string };

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  photo: string | null;
  role: TeamText | null;
  bio: TeamText | null;
}

// Add photo paths from public/images/team and confirmed profile copy here.
export const teamMembers: TeamMember[] = [
  {
    id: 'muhammad-azlan',
    name: 'Muhammad Azlan',
    initials: 'MA',
    photo: '/images/team/muhammad-azlan.png',
    role: null,
    bio: null,
  },
  {
    id: 'maulana-shidqi-albadawie',
    name: 'Maulana Shidqi Albadawie',
    initials: 'MSA',
    photo: '/images/team/masdiq.png',
    role: null,
    bio: null,
  },
  {
    id: 'muhammad-farhan-alafif',
    name: 'Muhammad Farhan Alafif',
    initials: 'MFA',
    photo: '/images/team/farhan.png',
    role: null,
    bio: null,
  },
];
