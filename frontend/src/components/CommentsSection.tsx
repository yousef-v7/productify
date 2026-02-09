import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from "../hooks/useComments";
import {
  SendIcon,
  Trash2Icon,
  MessageSquareIcon,
  LogInIcon,
  EditIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

type CommentUser = {
  name?: string | null;
  imageUrl?: string | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string | Date;
  userId: string;
  user?: CommentUser | null;
};

type Props = {
  productId: string;
  comments?: Comment[];
  currentUserId?: string | null;
};

function CommentsSection({ productId, comments = [], currentUserId }: Props) {
  const { isSignedIn } = useAuth();

  // create
  const [content, setContent] = useState("");
  const createComment = useCreateComment();

  // delete + update
  const deleteComment = useDeleteComment(productId);
  const updateComment = useUpdateComment(productId);

  // edit UI state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    createComment.mutate(
      { productId, content: content.trim() },
      { onSuccess: () => setContent("") },
    );
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = (commentId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;

    updateComment.mutate(
      { commentId, content: trimmed },
      {
        onSuccess: () => {
          cancelEdit();
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="size-5 text-primary" />
        <h3 className="font-bold">Comments</h3>
        <span className="badge badge-neutral badge-sm">{comments.length}</span>
      </div>

      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            className="input input-bordered input-sm flex-1 bg-base-200"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={createComment.isPending}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm btn-square"
            disabled={createComment.isPending || !content.trim()}
          >
            {createComment.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <SendIcon className="size-4" />
            )}
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between bg-base-200 rounded-lg p-3">
          <span className="text-sm text-base-content/60">
            Sign in to join the conversation
          </span>
          <SignInButton mode="modal">
            <button className="btn btn-primary btn-sm gap-1">
              <LogInIcon className="size-4" />
              Sign In
            </button>
          </SignInButton>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <MessageSquareIcon className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No comments yet. Be first!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = !!currentUserId && currentUserId === comment.userId;
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className="chat chat-start">
                <div className="chat-image avatar">
                  <div className="w-8 rounded-full">
                    <img
                      src={comment.user?.imageUrl ?? ""}
                      alt={comment.user?.name ?? "user"}
                    />
                  </div>
                </div>

                <div className="chat-header text-xs opacity-70 mb-2">
                  {comment.user?.name ?? "Unknown"}
                  <time className="ml-2 text-xs opacity-50">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </time>
                </div>

                {/* المحتوى */}
                <div className="chat-bubble chat-bubble-neutral text-sm w-full">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        className="input input-bordered input-sm flex-1 bg-base-200"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        disabled={updateComment.isPending}
                        autoFocus
                      />
                      <button
                        className="btn btn-success btn-sm btn-square"
                        onClick={() => saveEdit(comment.id)}
                        type="button"
                        disabled={
                          updateComment.isPending || !editContent.trim()
                        }
                        title="Save"
                      >
                        {updateComment.isPending ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <CheckIcon className="size-4" />
                        )}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-square"
                        onClick={cancelEdit}
                        type="button"
                        disabled={updateComment.isPending}
                        title="Cancel"
                      >
                        <XIcon className="size-4" />
                      </button>
                    </div>
                  ) : (
                    comment.content
                  )}
                </div>

                {/* أزرار صاحب التعليق */}
                {isOwner && (
                  <div className="chat-footer flex items-center gap-1 mt-1">
                    <button
                      onClick={() => startEdit(comment)}
                      className="btn btn-ghost btn-xs"
                      disabled={
                        deleteComment.isPending ||
                        updateComment.isPending ||
                        isEditing
                      }
                      title="Edit"
                      type="button"
                    >
                      <EditIcon className="size-3" />
                    </button>

                    <button
                      onClick={() =>
                        confirm("Delete?") &&
                        deleteComment.mutate({ commentId: comment.id })
                      }
                      className="btn btn-ghost btn-xs text-error"
                      disabled={
                        deleteComment.isPending || updateComment.isPending
                      }
                      title="Delete"
                      type="button"
                    >
                      {deleteComment.isPending ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <Trash2Icon className="size-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CommentsSection;
