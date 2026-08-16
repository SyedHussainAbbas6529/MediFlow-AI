from typing import Dict, Any
from app.core.config import settings

class VoiceService:
    def get_voice_config(self) -> Dict[str, Any]:
        """
        Returns active voice provider configuration and compliance notices.
        """
        provider = settings.VOICE_PROVIDER
        is_cloud_baa_required = (provider == "cloud")
        
        return {
            "active_provider": provider,
            "speech_recognition_available": True,
            "speech_synthesis_available": True,
            "baa_warning": is_cloud_baa_required,
            "disclaimer": (
                "Cloud-based voice processing requires an active HIPAA Business Associate Agreement (BAA). "
                "Defaulting to client-side Web Speech API / browser processing for privacy and zero PHI transmission risk."
                if is_cloud_baa_required else
                "Client-side zero-transmission voice engine active."
            )
        }

voice_service = VoiceService()
