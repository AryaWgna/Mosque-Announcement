<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the announcements.
     */
    public function index(Request $request)
    {
        $query = Announcement::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('content', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Sorting functionality
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        $allowedSortFields = ['id', 'title', 'created_at', 'updated_at', 'publish_at', 'is_active', 'category'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'created_at';
        }

        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $perPage = min(max((int)$perPage, 1), 100);

        $announcements = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $announcements->items(),
            'pagination' => [
                'current_page' => $announcements->currentPage(),
                'per_page' => $announcements->perPage(),
                'total' => $announcements->total(),
                'last_page' => $announcements->lastPage(),
                'from' => $announcements->firstItem(),
                'to' => $announcements->lastItem(),
            ],
            'categories' => Announcement::getCategories(),
        ], 200);
    }

    /**
     * Store a newly created announcement in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => ['required', 'string', Rule::in(array_keys(Announcement::getCategories()))],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // Max 5MB
            'video' => 'nullable|mimes:mp4,webm,ogg,mov|max:51200', // Max 50MB
            'publish_at' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $imagePath = null;
        $videoPath = null;
        $mediaType = 'none';

        // Handle Image Upload
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('announcements', 'public');
            $mediaType = 'image';
        }

        // Handle Video Upload (takes priority over image if both are uploaded)
        if ($request->hasFile('video')) {
            $videoPath = $request->file('video')->store('announcements/videos', 'public');
            $mediaType = 'video';
        }

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'],
            'image_path' => $imagePath,
            'video_path' => $videoPath,
            'media_type' => $mediaType,
            'publish_at' => $validated['publish_at'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dibuat',
            'data' => $announcement
        ], 201);
    }

    /**
     * Display the specified announcement.
     */
    public function show($id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $announcement,
            'categories' => Announcement::getCategories(),
        ], 200);
    }

    /**
     * Update the specified announcement in storage.
     */
    public function update(Request $request, $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'category' => ['sometimes', 'required', 'string', Rule::in(array_keys(Announcement::getCategories()))],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'video' => 'nullable|mimes:mp4,webm,ogg,mov|max:51200',
            'publish_at' => 'nullable|date',
            'is_active' => 'boolean',
            'remove_media' => 'nullable|boolean',
        ]);

        // Handle remove media request
        if ($request->boolean('remove_media')) {
            if ($announcement->image_path && Storage::disk('public')->exists($announcement->image_path)) {
                Storage::disk('public')->delete($announcement->image_path);
            }
            if ($announcement->video_path && Storage::disk('public')->exists($announcement->video_path)) {
                Storage::disk('public')->delete($announcement->video_path);
            }
            $announcement->image_path = null;
            $announcement->video_path = null;
            $announcement->media_type = 'none';
        }

        // Handle Image Upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($announcement->image_path && Storage::disk('public')->exists($announcement->image_path)) {
                Storage::disk('public')->delete($announcement->image_path);
            }
            // Delete old video if switching to image
            if ($announcement->video_path && Storage::disk('public')->exists($announcement->video_path)) {
                Storage::disk('public')->delete($announcement->video_path);
            }

            $imagePath = $request->file('image')->store('announcements', 'public');
            $announcement->image_path = $imagePath;
            $announcement->video_path = null;
            $announcement->media_type = 'image';
        }

        // Handle Video Upload
        if ($request->hasFile('video')) {
            // Delete old video if exists
            if ($announcement->video_path && Storage::disk('public')->exists($announcement->video_path)) {
                Storage::disk('public')->delete($announcement->video_path);
            }
            // Delete old image if switching to video
            if ($announcement->image_path && Storage::disk('public')->exists($announcement->image_path)) {
                Storage::disk('public')->delete($announcement->image_path);
            }

            $videoPath = $request->file('video')->store('announcements/videos', 'public');
            $announcement->video_path = $videoPath;
            $announcement->image_path = null;
            $announcement->media_type = 'video';
        }

        // Update other fields
        if (isset($validated['title'])) $announcement->title = $validated['title'];
        if (isset($validated['content'])) $announcement->content = $validated['content'];
        if (isset($validated['category'])) $announcement->category = $validated['category'];
        if (array_key_exists('publish_at', $validated)) $announcement->publish_at = $validated['publish_at'];
        if (isset($validated['is_active'])) $announcement->is_active = $validated['is_active'];

        $announcement->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil diperbarui',
            'data' => $announcement
        ], 200);
    }

    /**
     * Remove the specified announcement from storage.
     */
    public function destroy($id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan'
            ], 404);
        }

        // Delete image if exists
        if ($announcement->image_path && Storage::disk('public')->exists($announcement->image_path)) {
            Storage::disk('public')->delete($announcement->image_path);
        }

        // Delete video if exists
        if ($announcement->video_path && Storage::disk('public')->exists($announcement->video_path)) {
            Storage::disk('public')->delete($announcement->video_path);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dihapus'
        ], 200);
    }
}
