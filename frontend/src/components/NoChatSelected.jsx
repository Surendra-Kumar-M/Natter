import { MessageSquare } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-4 opacity-60">
        {/* Icon Display */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-base-300 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-base-content/50" />
          </div>
        </div>

        {/* Welcome Text */}
        <p className="text-base-content/80 font-medium">
          Natter for Web
        </p>
        <p className="text-sm text-base-content/60">
          Select a conversation to start messaging
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
