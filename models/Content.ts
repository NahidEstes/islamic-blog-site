import { Schema, model, models } from "mongoose";

const verificationFields = {
  verificationStatus: {
    type: String,
    enum: ["draft", "pending-verification", "verified", "rejected"],
    default: "draft",
    index: true
  },
  verificationNotes: String,
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  sourceUrl: String,
  lastReviewedAt: Date,
  language: { type: String, default: "ar" }
};

const QuranSurahSchema = new Schema(
  {
    number: { type: Number, unique: true },
    arabicName: String,
    englishName: String,
    transliteration: String,
    ayahCount: Number,
    ...verificationFields
  },
  { timestamps: true }
);
const QuranAyahSchema = new Schema(
  {
    surahNumber: { type: Number, index: true },
    ayahNumber: Number,
    arabicText: String,
    translation: String,
    tafsir: String,
    audioUrl: String,
    source: String,
    ...verificationFields
  },
  { timestamps: true }
);
QuranAyahSchema.index({ surahNumber: 1, ayahNumber: 1 }, { unique: true });

const HadithSchema = new Schema(
  {
    collection: { type: String, index: true },
    book: String,
    chapter: String,
    hadithNumber: String,
    arabicText: String,
    translation: String,
    reference: String,
    grade: String,
    narrator: String,
    notes: String,
    tags: [String],
    source: String,
    ...verificationFields
  },
  { timestamps: true }
);
HadithSchema.index(
  { collection: 1, hadithNumber: 1 },
  { unique: true, sparse: true }
);

export const QuranSurah =
  models.QuranSurah || model("QuranSurah", QuranSurahSchema);
export const QuranAyah =
  models.QuranAyah || model("QuranAyah", QuranAyahSchema);
export const Hadith = models.Hadith || model("Hadith", HadithSchema);
