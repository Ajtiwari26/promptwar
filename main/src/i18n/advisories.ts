export type SupportedLocale = "en" | "hi" | "mr";
export type AdvisoryTier = "child_friendly" | "general_public" | "sensitive_groups";

export interface TierAdvisories {
  child_friendly: string;
  general_public: string;
  sensitive_groups: string;
}

/**
 * Builds localized public citizen advisories across English, Hindi, and Marathi.
 * Shared between Gemini Pipeline, deterministic fallback, and Publisher Studio UI.
 */
export function buildLocalizedAdvisories(
  isEmergency: boolean,
  worstWard?: string | null,
  peakPm25?: number | null
): Record<SupportedLocale, TierAdvisories> {
  const wardEn = worstWard || "city zones";
  const wardHi = worstWard || "प्रमुख क्षेत्रों";
  const wardMr = worstWard || "शहरातील प्रमुख भागांमध्ये";
  const pmTag = peakPm25 ? ` (PM2.5: ${peakPm25} µg/m³)` : "";

  return {
    en: {
      child_friendly: isEmergency
        ? "The outdoor air has a dusty, smoky blanket today! Keep classroom windows shut and enjoy indoor drawing and games."
        : "The air outside is fresh today! Great weather for outdoor recess and sports activities.",
      general_public: isEmergency
        ? `High pollution alert in ${wardEn}${pmTag}. Avoid strenuous outdoor workouts during morning hours; wear N95 respirators when commuting or on outdoor gig/delivery shifts.`
        : "Air quality is currently in the satisfactory band. Normal outdoor activities and commuting may proceed without restriction.",
      sensitive_groups: isEmergency
        ? "Severe health risk for senior citizens, asthma/COPD patients, and pregnant women. Remain strictly indoors in filtered environments and ensure rescue inhalers are readily accessible."
        : "Air quality is acceptable. Individuals with acute respiratory sensitivity should monitor personal comfort levels."
    },
    hi: {
      child_friendly: isEmergency
        ? "आज बाहर की हवा में बहुत धुआं और धूल है! आज सभी खेल क्लास या घर के अंदर ही खेलें और खिड़कियां बंद रखें।"
        : "आज बाहर की हवा बिल्कुल साफ और अच्छी है! बाहर खेलने और सैर करने के लिए बेहतरीन दिन है।",
      general_public: isEmergency
        ? `${wardHi}${pmTag} में वायु गुणवत्ता गंभीर स्तर पर है। सुबह की दौड़ और भारी कसरत से बचें, बाहर निकलते समय या डिलीवरी शिफ्ट के दौरान N95 मास्क अवश्य लगाएं।`
        : "वायु गुणवत्ता संतोषजनक स्तर पर है। सामान्य दैनिक गतिविधियां बिना किसी रुकावट के जारी रखी जा सकती हैं।",
      sensitive_groups: isEmergency
        ? "वरिष्ठ नागरिकों, गर्भवती महिलाओं और दमा (अस्थमा) रोगियों के लिए विशेष चेतावनी: घर के अंदर सुरक्षित रहें और अपनी आवश्यक दवाइयां पास रखें।"
        : "हवा की स्थिति सामान्य है। संवेदनशील व्यक्ति अपनी व्यक्तिगत सुविधा के अनुसार सावधानी बरत सकते हैं।"
    },
    mr: {
      child_friendly: isEmergency
        ? "आज बाहेरील हवेत खूप धूर आणि धूळ आहे! आज सर्व खेळ वर्गात किंवा घराच्या आतच खेळा आणि खिडक्या बंद ठेवा."
        : "आज बाहेरील हवा अतिशय स्वच्छ आणि ताजी आहे! मैदानी खेळ आणि फिरण्यासाठी उत्तम दिवस आहे.",
      general_public: isEmergency
        ? `${wardMr}${pmTag} मध्ये हवेची गुणवत्ता गंभीर पातळीवर आहे. मैदानी व्यायाम टाळा आणि प्रवास किंवा डिलिव्हरी शिफ्ट दरम्यान N95 मास्क नक्की वापरा.`
        : "हवेची गुणवत्ता समाधानकारक आहे. नियमित दैनंदिन कामे आणि प्रवास कोणत्याही अडथळ्याशिवाय सुरू ठेवता येतील.",
      sensitive_groups: isEmergency
        ? "ज्येष्ठ नागरिक, गर्भवती महिला आणि दमा (अस्थमा) रुग्णांसाठी विशेष इशारा: घराच्या आत सुरक्षित रहा आणि इनहेलर जवळ ठेवा."
        : "हवेची स्थिती सामान्य आहे. श्वसनाचा त्रास असलेल्या व्यक्तींनी आवश्यक ती काळजी घ्यावी."
    }
  };
}
