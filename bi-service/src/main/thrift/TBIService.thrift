#@namespace scala co.datainsider.bi.service

service TBIService {

    bool migrateUserData(1: required string fromUserId, 2: required string toUserId)

    bool deleteUserData(1: required string userId)
}