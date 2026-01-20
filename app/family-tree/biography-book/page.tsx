import { fetchMembersWithBiography } from "./actions";
import { BiographyBook } from "./biography-book";

export const metadata = {
    title: "刘氏生平册",
    description: "刘氏家族生平事迹集",
};

export default async function BiographyBookPage() {
    const { data: members, error } = await fetchMembersWithBiography();

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-900">
                <div className="text-center text-white">
                    <p className="text-lg">加载失败</p>
                    <p className="text-sm text-white/60 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-900">
                <div className="text-center text-white">
                    <p className="text-lg">暂无生平事迹记录</p>
                    <p className="text-sm text-white/60 mt-2">请先在成员管理中添加生平事迹</p>
                </div>
            </div>
        );
    }

    return <BiographyBook members={members} />;
}
