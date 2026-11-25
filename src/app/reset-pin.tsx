// src/app/reset-pin.tsx
import { useRouter } from 'expo-router';

import OtpRequestScreen from '@/components/common/OtpRequestScreen';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { sendPinOtp } from '@/services/credentials/credentialsService';

export default function ResetPinScreen() {
    const router = useRouter();
    const { user, accessToken } = useAuth();
    const { t } = useLanguage();

    return (
        <OtpRequestScreen
            title={t('resetPin')}
            send={(mobile) =>
                sendPinOtp(user?.username ?? '', accessToken ?? '', mobile)
            }
            onSent={(mobile) =>
                router.push({ pathname: '/update-pin', params: { mobile } })
            }
        />
    );
}
