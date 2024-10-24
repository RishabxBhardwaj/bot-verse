import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { fetchData, fetchProfileData } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Activity, Code, Edit2, LogOut, Settings } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { useSettingsModal, useUpdateProfileModal } from "@/stores/modal-store";
import { ChatbotCard } from "@/components/ChatbotCard";
import { LikeAndReport } from "@/components/LikeAndReport";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { username } = useParams();
  const profileUpdateModal = useUpdateProfileModal();
  const settingsModal = useSettingsModal();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const { user: currentUser, logout } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user", username],
    queryFn: () => fetchProfileData(username!),

    retry() {
      return false;
    },
  });

  useEffect(() => {
    if (data?.user?.id && !userId) {
      setUserId(data.user.id);
    }
  }, [data, userId]);

  const {
    data: botsData,
    isLoading: botsLoading,
    error: botsError,
  } = useQuery({
    queryKey: ["user_bots"],
    queryFn: () => fetchData({ queues: ["user_bots"], uid: userId }),
    enabled: !!userId,
  });

  if (isError && (error as AxiosError).response?.status === 404) {
    return <Navigate to="/404" />; // Redirect to the 404 page
  }

  if (currentUser == null || isLoading || !data) {
    return <p>Loading wait..</p>;
  }

  const { user, contribution_score } = data;
  const self = currentUser.username == username;

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 space-y-8">
        {self && (
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-semibold">Profile</h2>
            <div className="flex space-x-2 mr-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() =>
                  profileUpdateModal.onOpen({
                    prevName: user.name,
                    prevBio: user.bio,
                    prevUsername: user.username,
                  })
                }
                className="rounded-full"
              >
                <Edit2 className="w-20 h-20" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={() => settingsModal.onOpen()}
              >
                <Settings className="w-20 h-20" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => logout()}
                className="rounded-full"
              >
                <LogOut className="w-20 h-20" />
              </Button>
            </div>
          </div>
        )}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <img className="w-24 h-24 rounded-full" src={user.avatar} />

              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
                <p>{user.bio}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <Badge variant="outline">
                    <Activity className="w-4 h-4 mr-1" />
                    Joined {moment(user.created_at).fromNow()}
                  </Badge>
                  <Badge variant="outline">
                    <Code className="w-4 h-4 mr-1" />
                    {contribution_score} Contributions
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-row mt-3 -mb-2 justify-end">
              <LikeAndReport
                id={user.id}
                likes={user.likes}
                reports={user.reports}
                queryKeys={["user", user.username]}
                type="user"
              />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-flow-dense grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-3 w-full">
          {botsLoading ? (
            <div className="col-span-1 text-center">Loading...</div>
          ) : botsError ? (
            <div className="col-span-1 text-red-500 text-center">
              {botsError?.message}
            </div>
          ) : botsData!.user_bots && botsData!.user_bots?.length > 0 ? (
            botsData!.user_bots?.map((item) => (
              <ChatbotCard
                chatbot={item}
                queryKeys={["user_bots"]}
                key={item.name}
              />
            ))
          ) : (
            <div className="col-span-1 text-center">No bots available.</div>
          )}
        </div>
      </div>
    </>
  );
}
