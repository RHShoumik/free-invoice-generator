import { Navigate, Route, Routes } from 'react-router-dom'
import { EditorLayout } from './features/invoice-editor/EditorLayout'
import { TemplateGallery } from './features/template-gallery/TemplateGallery'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<TemplateGallery />} />
      <Route path="/editor" element={<EditorLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
