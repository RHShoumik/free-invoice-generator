import { Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { ContentPage } from './features/content/ContentPage'
import { NotFound } from './features/content/NotFound'
import { EditorLayout } from './features/invoice-editor/EditorLayout'
import { TemplateGallery } from './features/template-gallery/TemplateGallery'
import { SEO_PAGES } from './lib/seoPages'

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<TemplateGallery />} />
        <Route path="/editor" element={<EditorLayout />} />
        {SEO_PAGES.map((page) => (
          <Route key={page.path} path={page.path} element={<ContentPage page={page} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
