import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../utils/document-entity-helper';
import { FileSchemaClass } from '../files/infrastructure/persistence/document/entities/file.schema';

export type BusinessSchemaDocument = HydratedDocument<BusinessSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class BusinessSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  displayName: string;

  @Prop({
    type: String,
    required: true,
  })
  businessName: string;

  @Prop({
    type: String,
  })
  description?: string;

  @Prop({
    type: FileSchemaClass,
  })
  logo?: FileSchemaClass;

  @Prop({
    type: String,
  })
  stripeAccountId?: string;

  @Prop({
    type: String,
  })
  stripeConnectId?: string;

  @Prop({
    type: Object,
    default: {
      onboardingComplete: false,
      paymentsEnabled: false,
      detailsSubmitted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      requirementsDisabled: false,
    },
  })
  stripeAccountStatus: {
    onboardingComplete: boolean;
    paymentsEnabled: boolean;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirementsDisabled: boolean;
    currentlyDue?: string[];
    eventuallyDue?: string[];
    pastDue?: string[];
  };

  @Prop({
    type: Boolean,
    default: false,
  })
  isStripeSetupComplete: boolean;

  @Prop({
    type: [String],
    default: [],
  })
  owners: string[];

  @Prop({
    type: String,
    required: true,
  })
  primaryOwner: string;

  @Prop({
    type: String,
  })
  phone?: string;

  @Prop({
    type: String,
  })
  website?: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  active: boolean;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const BusinessSchema = SchemaFactory.createForClass(BusinessSchemaClass);

// Create indexes
BusinessSchema.index({ displayName: 1 }, { unique: true });
BusinessSchema.index({ stripeAccountId: 1 }, { sparse: true });
BusinessSchema.index({ stripeConnectId: 1 }, { sparse: true });
BusinessSchema.index({ owners: 1 });
BusinessSchema.index({ primaryOwner: 1 });
BusinessSchema.index({ active: 1 });
