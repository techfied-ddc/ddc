import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ICategory extends Document {
  _id:         Types.ObjectId;
  name:        string;
  description?: string;
  imageUrl?:   string;
  sortOrder:   number;
  enabled:     boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    imageUrl:    { type: String },
    sortOrder:   { type: Number, default: 0, min: 0 },
    enabled:     { type: Boolean, default: true },
  },
  { timestamps: true },
);

CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ enabled: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
