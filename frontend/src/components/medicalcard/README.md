# MedicalCard Refactoring

## Overview

The MedicalCard component has been refactored from a single 4,097-line file into multiple smaller, maintainable files, each under 400 lines.

## File Structure

```
medicalcard/
├── MedicalCardRefactored.js       (main component, ~250 lines)
├── useMedicalCardState.js          (state management, ~120 lines)
├── useMedicalCardHandlers.js       (data loading handlers, ~210 lines)
├── useMedicalCardDataTransformers.js (data transformation, ~260 lines)
├── useMedicalCardDataIntegration.js (data integration, ~260 lines)
├── MedicalCardLoading.js          (loading component, ~30 lines)
├── MedicalCardNoData.js           (no data component, ~20 lines)
├── MedicalCardOverview.js         (overview section, ~180 lines)
├── MedicalCardPersonalData.js     (personal data, ~50 lines)
├── MedicalCardAnamnesis.js        (anamnesis section, ~130 lines)
├── MedicalCardPhotoAnalysis.js    (photo analysis, ~230 lines)
├── MedicalCardIntraoralAnalysis.js (intraoral analysis, ~130 lines)
├── MedicalCardAnthropometry.js    (anthropometry section, ~150 lines)
├── MedicalCardCephalometry.js     (cephalometry section, ~200 lines)
├── MedicalCardModeling3D.js       (3D modeling section, ~110 lines)
├── MedicalCardCTAnalysis.js       (CT analysis section, ~120 lines)
├── MedicalCardDiagnoses.js        (diagnoses section, ~120 lines)
├── MedicalCardTreatmentPlan.js    (treatment plan, ~180 lines)
└── MedicalCardConclusions.js      (conclusions section, ~80 lines)
```

## Component Architecture

### 1. Hooks (Data & State Management)

#### `useMedicalCardState.js`
Manages all component state:
- Medical and orthodontic data
- Module data
- Loading states
- Image states (photometry, cephalometry, biometry, modeling, CT)
- UI states (active tabs, show/hide sections)
- Refs

#### `useMedicalCardHandlers.js`
Data loading handlers:
- `loadPhotometryDataForMedicalCard()` - Loads photometry data from context, localStorage, or medical_card
- `loadBiometryDataForMedicalCard()` - Loads biometry data
- `loadCephalometryDataForMedicalCard()` - Loads cephalometry data
- `loadModelingDataForMedicalCard()` - Loads modeling data
- `loadCTDataForMedicalCard()` - Loads CT data

#### `useMedicalCardDataTransformers.js`
Data transformation functions:
- `transformPhotometryData()` - Transforms photometry data into medical card structure
- `transformBiometryData()` - Transforms biometry data
- `transformCephalometryData()` - Transforms cephalometry data
- `transformModelingData()` - Transforms modeling data
- `transformCTData()` - Transforms CT data
- `extractImagesFromModuleData()` - Extracts images/models from module data

#### `useMedicalCardDataIntegration.js`
Data integration logic:
- `getIntegratedMedicalData()` - Creates integrated medical data structure with all diagnostic modules

### 2. UI Components

#### `MedicalCardRefactored.js` (Main Component)
- Orchestrates all hooks and UI components
- Manages data loading flow
- Handles exports (presentation, JSON)
- Renders module tabs and active content

#### `MedicalCardLoading.js`
- Displays loading spinner
- Shows progress of module data loading

#### `MedicalCardNoData.js`
- Displays when no medical data is available
- Provides option to load data

#### `MedicalCardOverview.js`
- Summary of patient information
- Overview of diagnoses
- Key metrics
- Loaded modules display

#### `MedicalCardPersonalData.js`
- Patient personal information
- Birth date, age, examination date
- Doctor and complaints

#### `MedicalCardAnamnesis.js`
- Prenatal history
- Early development
- Bad habits
- Family history
- Past diseases
- Previous orthodontic treatment
- General health and hygiene

#### `MedicalCardPhotoAnalysis.js`
- Tabbed interface (Frontal, Profile, 45°, Intraoral)
- Facial proportions and symmetry
- Profile parameters and lip positions
- E-line analysis
- Image display with analysis results

#### `MedicalCardIntraoralAnalysis.js`
- Occlusion analysis (sagittal, vertical, transversal)
- Dental formula with tooth measurements
- Comments and notes

#### `MedicalCardAnthropometry.js`
- Jaw dimensions
- Indices (Ton Index, Bolton Analysis)
- Tooth sizes
- Detailed biometry data display

#### `MedicalCardCephalometry.js`
- Tabbed interface (Lateral TRG, Frontal TRG)
- Angular parameters (SNA, SNB, ANB, etc.)
- Jaw positions
- Vertical parameters
- Measurements and images

#### `MedicalCardModeling3D.js`
- 3D models status
- Simulations
- Detailed modeling data

#### `MedicalCardCTAnalysis.js`
- OPTG findings
- TMJ analysis
- Axial cuts
- Bone structure
- Detailed CT data

#### `MedicalCardDiagnoses.js`
- Categorized diagnoses
- Severity indicators
- Confirmation status
- Statistics summary

#### `MedicalCardTreatmentPlan.js`
- Treatment complexity and duration
- Objectives
- Phases with procedures
- Appliances
- Retention plan
- Statistics

#### `MedicalCardConclusions.js`
- Main conclusions
- Sample conclusions from presentation

## Data Flow

1. **Component Mount** → `useEffect` triggers `loadMedicalData()`
2. **Load Data** → All module data loaders run in parallel (Promise.all)
3. **Store Modules** → Module data stored in `moduleData` state
4. **Integrate Data** → `getIntegratedMedicalData()` creates integrated structure
5. **Transform Data** → Each module's data is transformed if needed
6. **Extract Images** → Images and models extracted and stored
7. **Update State** → `orthodonticData` and other states updated
8. **Render UI** → Active module tab content is rendered

## Key Patterns

### 1. Separation of Concerns
- State management in hooks
- Business logic in handlers/transformers
- UI in separate components
- Main component orchestrates everything

### 2. Reusable Hooks
Each hook can be tested independently and reused:
- `useMedicalCardState` - Can be adapted for other medical views
- `useMedicalCardHandlers` - Generic data loading pattern
- `useMedicalCardDataTransformers` - Data transformation utilities
- `useMedicalCardDataIntegration` - Integration logic

### 3. Tab-Based UI
All section components with multiple views use a consistent tab pattern:
- State: `activeTab` (or `activeSection`)
- UI: Tab buttons with active state styling
- Content: Conditional rendering based on active tab

### 4. Data Integration Strategy
The component integrates data from multiple sources in order of priority:
1. React Context (most recent)
2. LocalStorage
3. Medical card storage

## Migration Guide

The original `MedicalCard.js` now simply exports the refactored component:

```javascript
export { default } from './medicalcard/MedicalCardRefactored';
```

This ensures backward compatibility - all existing imports continue to work without changes.

## Benefits of Refactoring

1. **Maintainability**: Each file has a single responsibility
2. **Readability**: Smaller files are easier to understand
3. **Testability**: Individual hooks and components can be tested separately
4. **Reusability**: Hooks can be reused in other components
5. **Performance**: Smaller components can be optimized independently
6. **Collaboration**: Multiple developers can work on different files simultaneously

## Future Improvements

1. Add unit tests for each hook and component
2. Consider TypeScript for better type safety
3. Extract common UI patterns (tabs, cards) into shared components
4. Optimize re-renders with React.memo where appropriate
5. Add error boundaries for better error handling
6. Consider using React Query for data fetching and caching

## Related Files

- Original: `frontend/src/components/MedicalCard.js` (4,097 lines → 6 lines)
- Refactored: `frontend/src/components/medicalcard/` (19 files, all < 400 lines)
- Context: `frontend/src/contexts/DataContext.js`
- Services: `frontend/src/services/ModuleDataService.js`
