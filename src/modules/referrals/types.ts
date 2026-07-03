export type ReferralStats = {
  referralCode: string;
  participantName: string;
  shareUrl: string;
  referrals: {
    id: string;
    protocol: string;
    participantName: string;
    status: string;
    rewardGranted: boolean;
    createdAt: Date;
  }[];
  referralsCount: number;
};

export type GuardianReferralPanel = {
  participantName: string;
  referralCode: string;
  shareUrl: string;
  confirmedCount: number;
  pendingCount: number;
  goalCount: number;
  rewardLikesCount: number;
  campaignActive: boolean;
};
