
import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  ZoomIn, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { Project } from '../types';
import { supabase } from '../services/supabaseClient';
import { projectService } from '../services/projectService';

interface PhotoGalleryProps {
  projects: Project[];
  selectedProjectId: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ projects, selectedProjectId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; name: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const project = projects.find(p => p.id === selectedProjectId);
  const photos = project?.photos || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !project) return;

    if (photos.length >= 10) {
      alert("Limite massimo di 10 foto raggiunto per questo cantiere.");
      return;
    }

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert("La foto è troppo grande. Massimo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `photos/${project.id}/${fileName}`;

      // Upload to existing project-files bucket
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      const newPhoto = {
        id: Math.random().toString(36).substring(2, 9),
        url: urlData.publicUrl,
        name: file.name,
        storage_path: filePath
      };

      const updatedPhotos = [...photos, newPhoto];
      await projectService.updateProject({
        ...project,
        photos: updatedPhotos
      });

      // Dispatch event to refresh data in App.tsx
      window.dispatchEvent(new CustomEvent('accounting-updated'));
      
    } catch (error) {
      console.error("Errore upload foto:", error);
      alert("Errore durante il caricamento della foto.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!project) return;
    const photoToDelete = photos.find(p => p.id === photoId);
    if (!photoToDelete) return;

    try {
      // 1. Remove from storage
      await supabase.storage
        .from('project-files')
        .remove([photoToDelete.storage_path]);

      // 2. Update project database
      const updatedPhotos = photos.filter(p => p.id !== photoId);
      await projectService.updateProject({
        ...project,
        photos: updatedPhotos
      });

      setConfirmDelete(null);
      window.dispatchEvent(new CustomEvent('accounting-updated'));
    } catch (error) {
      console.error("Errore eliminazione foto:", error);
      alert("Errore durante l'eliminazione della foto.");
    }
  };

  if (!selectedProjectId) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300">
        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
          <ImageIcon size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">Seleziona un Cantiere</h3>
        <p className="text-slate-500">Seleziona un cantiere dal menu laterale per visualizzare la galleria fotografica.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Galleria Foto</h2>
            <p className="text-sm text-slate-500">Gestisci la documentazione fotografica del cantiere: <span className="font-bold text-emerald-600">{project?.name}</span></p>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => handleUpload(e)}
            />
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={cameraInputRef}
              onChange={(e) => handleUpload(e, true)}
            />
            
            <button 
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading || photos.length >= 10}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-100"
            >
              <Camera size={20} />
              <span className="hidden sm:inline">Scatta Foto</span>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || photos.length >= 10}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
            >
              <Upload size={20} />
              <span className="hidden sm:inline">Carica File</span>
            </button>
          </div>
        </div>

        {photos.length === 0 && !isUploading ? (
          <div className="mt-12 text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
            <Camera size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Nessuna foto caricata per questo progetto</p>
            <p className="text-xs text-slate-300 mt-1">Puoi caricare fino a 10 foto rappresentative dello stato dei lavori</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm transition-all hover:shadow-md">
                <img 
                  src={photo.url} 
                  alt={photo.name} 
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110"
                  onClick={() => setZoomPhoto(photo)}
                />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={() => setZoomPhoto(photo)}
                    className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                  >
                    <ZoomIn size={20} />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(photo.id)}
                    className="p-2 bg-rose-500/80 backdrop-blur-md rounded-full text-white hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {confirmDelete === photo.id && (
                  <div className="absolute inset-0 bg-rose-600/90 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center">
                    <AlertCircle size={24} className="text-white mb-2" />
                    <p className="text-white text-xs font-bold mb-3 uppercase tracking-wider">Eliminare la foto?</p>
                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="flex-1 py-1.5 bg-white text-rose-600 rounded-lg text-xs font-black uppercase hover:bg-rose-50 transition-colors"
                      >
                        Sì
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(null)}
                        className="flex-1 py-1.5 bg-black/20 text-white rounded-lg text-xs font-bold uppercase hover:bg-black/40 transition-colors border border-white/20"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isUploading && (
              <div className="aspect-square rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center text-emerald-600 animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mb-2"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Caricamento...</span>
              </div>
            )}

            {photos.length < 10 && !isUploading && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-blue-300 hover:text-blue-500 transition-all group"
              >
                <Plus size={32} className="mb-2 transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Aggiungi</span>
                <span className="text-[10px] opacity-60 mt-0.5">{photos.length}/10</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomPhoto && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <button 
            onClick={() => setZoomPhoto(null)}
            className="absolute top-4 right-4 p-3 text-white/60 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>
          
          <img 
            src={zoomPhoto.url} 
            alt={zoomPhoto.name} 
            className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg"
          />
          
          <div className="mt-6 flex flex-col items-center">
            <p className="text-white text-lg font-bold">{zoomPhoto.name}</p>
            <div className="mt-4 flex gap-4">
              <a 
                href={zoomPhoto.url} 
                target="_blank" 
                rel="noreferrer"
                className="px-6 py-2 bg-white/10 text-white rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-all text-sm"
              >
                Apri Originale
              </a>
              <button 
                onClick={() => setZoomPhoto(null)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all text-sm"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
